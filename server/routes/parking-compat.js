/**
 * ══════════════════════════════════════════════════════════════════════
 *  Backward-Compatibility Routes
 *  Preserves the original /api/* endpoints with flat JSON responses
 *  so the existing React frontend continues to work unchanged.
 *
 *  The frontend currently calls:
 *    GET  /api/slots          → flat array of slots
 *    GET  /api/pricing        → flat pricing object
 *    POST /api/park           → flat park response
 *    POST /api/unpark         → flat unpark response
 *    GET  /api/search/:plate  → flat slot object
 *    POST /api/locate         → flat locate response
 *    GET  /api/analytics      → flat analytics object
 * ══════════════════════════════════════════════════════════════════════
 */
const express     = require('express');
const router      = express.Router();
const Slot        = require('../models/Slot');
const Transaction = require('../models/Transaction');

const BASE_RATES = { A: 10, B: 30, C: 50 };

async function getDynamicRate(zone) {
  const totalSlots = await Slot.countDocuments();
  const occupied   = await Slot.countDocuments({ status: 'Occupied' });
  const multiplier = 1 + (occupied / Math.max(totalSlots, 1));
  return Math.round(BASE_RATES[zone] * multiplier);
}

module.exports = (heaps, typeToZone, io) => {

  async function broadcast() {
    const slots = await Slot.find().sort({ slotNumber: 1 }).lean();
    io.emit('slotsUpdated', slots);
    return slots;
  }

  // GET /api/slots
  router.get('/slots', async (_req, res) => {
    try {
      const slots = await Slot.find().sort({ slotNumber: 1 }).lean();
      res.json(slots);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // GET /api/pricing
  router.get('/pricing', async (_req, res) => {
    try {
      const totalSlots = await Slot.countDocuments();
      const occupied   = await Slot.countDocuments({ status: 'Occupied' });
      const multiplier = 1 + (occupied / Math.max(totalSlots, 1));
      res.json({
        multiplier: Math.round(multiplier * 100) / 100,
        rates: {
          A: Math.round(BASE_RATES.A * multiplier),
          B: Math.round(BASE_RATES.B * multiplier),
          C: Math.round(BASE_RATES.C * multiplier),
        },
        occupied,
        totalSlots,
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // POST /api/park
  router.post('/park', async (req, res) => {
    try {
      const { vehicleNumber, vehicleType, zone: requestedZone } = req.body;
      if (!vehicleNumber || !vehicleType) {
        return res.status(400).json({ error: 'vehicleNumber and vehicleType are required.' });
      }

      const zone = requestedZone && heaps[requestedZone] ? requestedZone : typeToZone[vehicleType];
      if (!zone) return res.status(400).json({ error: `Unknown vehicle type: ${vehicleType}` });

      const existing = await Slot.findOne({ vehicleNumber, status: 'Occupied' });
      if (existing) {
        return res.status(409).json({ error: `Vehicle ${vehicleNumber} is already parked at slot ${existing.slotNumber} (Zone ${existing.zone}).` });
      }

      const heap = heaps[zone];
      const slotNumber = heap.extractMin();
      if (slotNumber === null) {
        return res.status(409).json({ error: `Zone ${zone} is full! No slots available.` });
      }

      const entryTime = new Date();
      const dynamicRate = await getDynamicRate(zone);

      await Slot.findOneAndUpdate({ slotNumber }, { status: 'Occupied', vehicleNumber, vehicleType, entryTime });
      await Transaction.create({ vehicleNumber, vehicleType, slotNumber, zone, entryTime });
      await broadcast();

      res.json({
        message: `Vehicle parked at Zone ${zone}, Slot ${slotNumber}.`,
        slotNumber, zone, entryTime,
        currentRate: `₹${dynamicRate}/hr`,
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // POST /api/unpark
  router.post('/unpark', async (req, res) => {
    try {
      const { vehicleNumber } = req.body;
      if (!vehicleNumber) return res.status(400).json({ error: 'vehicleNumber is required.' });

      const slot = await Slot.findOne({ vehicleNumber, status: 'Occupied' });
      if (!slot) return res.status(404).json({ error: 'Vehicle not found in the parking lot.' });

      const exitTime = new Date();
      const durationMs = exitTime - slot.entryTime;
      const durationMin = durationMs / 1000 / 60;
      const dynamicRate = await getDynamicRate(slot.zone);
      const hours = Math.max(1, Math.ceil(durationMin / 60));
      const fee = hours * dynamicRate;

      await Slot.findOneAndUpdate(
        { slotNumber: slot.slotNumber },
        { status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null }
      );
      heaps[slot.zone].insert(slot.slotNumber);
      await Transaction.findOneAndUpdate(
        { vehicleNumber, exitTime: null },
        { exitTime, durationMinutes: Math.round(durationMin), fee },
        { sort: { entryTime: -1 } }
      );
      await broadcast();

      res.json({
        message: `Vehicle removed from Zone ${slot.zone}, Slot ${slot.slotNumber}.`,
        slotNumber: slot.slotNumber,
        zone: slot.zone,
        duration: `${Math.round(durationMin)} min`,
        hours,
        ratePerHour: `₹${dynamicRate}/hr`,
        fee: `₹${fee}`,
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // GET /api/search/:plate
  router.get('/search/:plate', async (req, res) => {
    try {
      const slot = await Slot.findOne({
        vehicleNumber: { $regex: new RegExp(req.params.plate, 'i') },
        status: 'Occupied',
      }).lean();
      if (!slot) return res.status(404).json({ error: 'Vehicle not found.' });
      res.json(slot);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // POST /api/locate
  router.post('/locate', async (req, res) => {
    try {
      const { vehicleNumber } = req.body;
      if (!vehicleNumber) return res.status(400).json({ error: 'vehicleNumber is required.' });

      const escaped = vehicleNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const slot = await Slot.findOne({
        vehicleNumber: { $regex: new RegExp(`^${escaped}$`, 'i') },
        status: 'Occupied',
      }).lean();
      if (!slot) return res.status(404).json({ error: 'Vehicle not found in the parking lot.' });

      const now = new Date();
      const durationMin = Math.round((now - new Date(slot.entryTime)) / 1000 / 60);
      const dynamicRate = await getDynamicRate(slot.zone);
      const hours = Math.max(1, Math.ceil(durationMin / 60));
      const estimatedFee = hours * dynamicRate;

      res.json({
        found: true,
        slotNumber: slot.slotNumber,
        zone: slot.zone,
        zoneLabel: slot.zoneLabel,
        vehicleNumber: slot.vehicleNumber,
        vehicleType: slot.vehicleType,
        entryTime: slot.entryTime,
        parkedFor: `${durationMin} min`,
        estimatedFee: `₹${estimatedFee}`,
        currentRate: `₹${dynamicRate}/hr`,
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // GET /api/analytics
  router.get('/analytics', async (_req, res) => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [occupancy, revenue, heatmap, avgResult, vehicleHistory, totalParked, totalSlots] =
        await Promise.all([
          Transaction.aggregate([
            { $match: { entryTime: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $hour: '$entryTime' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, hour: '$_id', count: 1 } },
          ]),
          Transaction.aggregate([
            { $match: { exitTime: { $gte: sevenDaysAgo }, fee: { $ne: null } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$exitTime' } }, total: { $sum: '$fee' } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: '$_id', total: 1 } },
          ]),
          Transaction.aggregate([
            { $group: { _id: '$slotNumber', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, slot: '$_id', count: 1 } },
          ]),
          Transaction.aggregate([
            { $match: { durationMinutes: { $ne: null } } },
            { $group: { _id: null, avg: { $avg: '$durationMinutes' } } },
          ]),
          Transaction.find({ exitTime: { $ne: null } }).sort({ exitTime: -1 }).limit(50)
            .select('vehicleNumber vehicleType slotNumber entryTime exitTime durationMinutes fee').lean(),
          Slot.countDocuments({ status: 'Occupied' }),
          Slot.countDocuments(),
        ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const revenueToday = await Transaction.aggregate([
        { $match: { exitTime: { $gte: todayStart }, fee: { $ne: null } } },
        { $group: { _id: null, total: { $sum: '$fee' } } },
      ]);

      const multiplier = 1 + (totalParked / Math.max(totalSlots, 1));

      res.json({
        occupancy, revenue, heatmap, vehicleHistory,
        avgDuration: Math.round(avgResult[0]?.avg || 0),
        totalParked, totalSlots,
        revenueToday: revenueToday[0]?.total || 0,
        pricing: {
          multiplier: Math.round(multiplier * 100) / 100,
          rates: {
            A: Math.round(BASE_RATES.A * multiplier),
            B: Math.round(BASE_RATES.B * multiplier),
            C: Math.round(BASE_RATES.C * multiplier),
          },
        },
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  return router;
};
