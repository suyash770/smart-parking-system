/**
 * ══════════════════════════════════════════════════════════════════════
 *  SmartPark — Parking Slot API
 *  RESTful resource-oriented design following API Design Principles:
 *
 *  ┌────────┬──────────────────────────────────┬──────────┬───────────┐
 *  │ Method │ Endpoint                         │ Auth     │ Purpose   │
 *  ├────────┼──────────────────────────────────┼──────────┼───────────┤
 *  │ GET    │ /api/v1/slots                    │ Optional │ List all  │
 *  │ GET    │ /api/v1/slots/:slotNumber        │ Optional │ Get one   │
 *  │ PATCH  │ /api/v1/slots/:slotNumber/status │ Required │ Reserve   │
 *  │ POST   │ /api/v1/slots/park               │ Optional │ Park      │
 *  │ POST   │ /api/v1/slots/unpark             │ Optional │ Unpark    │
 *  │ GET    │ /api/v1/slots/search/:plate      │ Optional │ Search    │
 *  │ GET    │ /api/v1/slots/locate/:plate      │ Optional │ Locate    │
 *  │ GET    │ /api/v1/slots/pricing             │ Public   │ Rates     │
 *  │ GET    │ /api/v1/slots/analytics           │ RBAC     │ Dashboard │
 *  │ GET    │ /api/v1/transactions              │ RBAC     │ History   │
 *  │ GET    │ /api/v1/transactions/:id          │ RBAC     │ Detail    │
 *  └────────┴──────────────────────────────────┴──────────┴───────────┘
 *
 *  Design Principles Applied:
 *  ✓ Resource-oriented URLs (nouns, not verbs)
 *  ✓ Proper HTTP methods & status codes
 *  ✓ Consistent error response format
 *  ✓ Pagination for collections
 *  ✓ Filtering & sorting via query params
 *  ✓ Auth middleware with RBAC
 *  ✓ Input validation
 *  ✓ Structured JSON envelope responses
 * ══════════════════════════════════════════════════════════════════════
 */
const express     = require('express');
const router      = express.Router();
const Slot        = require('../models/Slot');
const Transaction = require('../models/Transaction');
const { optionalAuth, authMiddleware, requireRole } = require('../middleware/auth');

/* ══════════════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════════════ */
const BASE_RATES = { A: 10, B: 30, C: 50 };
const VALID_ZONES   = ['A', 'B', 'C'];
const VALID_STATUSES = ['Free', 'Occupied', 'Reserved'];
const VALID_VEHICLE_TYPES = ['Bike', 'Scooter', 'Car', 'SUV', 'Van', 'Truck'];

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Build a structured error response.
 * Follows the pattern: { error, message, details?, path, timestamp }
 */
function errorResponse(res, statusCode, error, message, details = null) {
  const body = {
    error,
    message,
    timestamp: new Date().toISOString(),
  };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

/**
 * Build a structured success response with optional metadata.
 * Follows the pattern: { data, meta? }
 */
function successResponse(res, data, meta = null, statusCode = 200) {
  const body = { data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * Build a paginated response.
 * Follows the pattern: { data, meta: { total, page, pageSize, pages, hasNext, hasPrev } }
 */
function paginatedResponse(res, items, total, page, pageSize) {
  const pages = Math.ceil(total / pageSize);
  return res.json({
    data: items,
    meta: {
      total,
      page,
      pageSize,
      pages,
      hasNext:  page < pages,
      hasPrev:  page > 1,
    },
  });
}

/**
 * Dynamic pricing — Price = BaseRate × (1 + occupied/total)
 */
async function getDynamicRate(zone) {
  const totalSlots = await Slot.countDocuments();
  const occupied   = await Slot.countDocuments({ status: 'Occupied' });
  const multiplier = 1 + (occupied / Math.max(totalSlots, 1));
  return Math.round(BASE_RATES[zone] * multiplier);
}

/**
 * Get current pricing info for all zones.
 */
async function getPricingInfo() {
  const totalSlots = await Slot.countDocuments();
  const occupied   = await Slot.countDocuments({ status: 'Occupied' });
  const multiplier = 1 + (occupied / Math.max(totalSlots, 1));
  return {
    multiplier: Math.round(multiplier * 100) / 100,
    rates: {
      A: Math.round(BASE_RATES.A * multiplier),
      B: Math.round(BASE_RATES.B * multiplier),
      C: Math.round(BASE_RATES.C * multiplier),
    },
    occupied,
    totalSlots,
  };
}


/* ══════════════════════════════════════════════════════════════════════
   FACTORY — Receives heaps, typeToZone, io from server bootstrap
   ══════════════════════════════════════════════════════════════════════ */
module.exports = (heaps, typeToZone, io) => {

  /** Broadcast fresh slot list to all connected Socket.io clients. */
  async function broadcast() {
    const slots = await Slot.find().sort({ slotNumber: 1 }).lean();
    io.emit('slotsUpdated', slots);
    return slots;
  }


  /* ────────────────────────────────────────────────────────────────────
     GET /api/v1/slots
     List all parking slots with filtering, sorting & pagination.

     Query params:
       ?zone=A|B|C          Filter by zone
       ?status=Free|Occupied|Reserved    Filter by status
       ?floor=1|2           Filter by floor
       ?sort=slotNumber     Sort field (default: slotNumber)
       ?order=asc|desc      Sort order (default: asc)
       ?page=1              Page number (default: 1)
       ?pageSize=20         Items per page (default: 20, max: 100)

     Returns: { data: Slot[], meta: { total, page, pageSize, pages, hasNext, hasPrev } }
     ──────────────────────────────────────────────────────────────────── */
  router.get('/slots', optionalAuth, async (req, res) => {
    try {
      const {
        zone, status, floor,
        sort = 'slotNumber',
        order = 'asc',
        page = '1',
        pageSize = '40',
      } = req.query;

      // Build filter
      const filter = {};
      if (zone && VALID_ZONES.includes(zone)) filter.zone = zone;
      if (status && VALID_STATUSES.includes(status)) filter.status = status;
      if (floor) filter.floor = parseInt(floor, 10);

      // Pagination
      const p  = Math.max(1, parseInt(page, 10) || 1);
      const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 40));
      const skip = (p - 1) * ps;

      // Sort
      const sortDir = order === 'desc' ? -1 : 1;
      const sortObj = { [sort]: sortDir };

      const [slots, total] = await Promise.all([
        Slot.find(filter).sort(sortObj).skip(skip).limit(ps).lean(),
        Slot.countDocuments(filter),
      ]);

      return paginatedResponse(res, slots, total, p, ps);
    } catch (err) {
      return errorResponse(res, 500, 'InternalError', err.message);
    }
  });


  /* ────────────────────────────────────────────────────────────────────
     GET /api/v1/slots/pricing
     Get current dynamic pricing rates for all zones.

     Returns: { data: { multiplier, rates: {A, B, C}, occupied, totalSlots } }
     ──────────────────────────────────────────────────────────────────── */
  router.get('/slots/pricing', async (_req, res) => {
    try {
      const pricing = await getPricingInfo();
      return successResponse(res, pricing);
    } catch (err) {
      return errorResponse(res, 500, 'InternalError', err.message);
    }
  });


  /* ────────────────────────────────────────────────────────────────────
     GET /api/v1/slots/search/:plate
     Search for a vehicle by license plate (partial match, case-insensitive).

     Returns: { data: Slot }
     ──────────────────────────────────────────────────────────────────── */
  router.get('/slots/search/:plate', optionalAuth, async (req, res) => {
    try {
      const { plate } = req.params;
      if (!plate || plate.trim().length < 2) {
        return errorResponse(res, 400, 'ValidationError', 'Plate must be at least 2 characters.', {
          field: 'plate',
          value: plate,
        });
      }

      const slot = await Slot.findOne({
        vehicleNumber: { $regex: new RegExp(plate, 'i') },
        status: 'Occupied',
      }).lean();

      if (!slot) {
        return errorResponse(res, 404, 'NotFound', `No vehicle matching "${plate}" found in the parking lot.`);
      }

      return successResponse(res, slot);
    } catch (err) {
      return errorResponse(res, 500, 'InternalError', err.message);
    }
  });


  /* ────────────────────────────────────────────────────────────────────
     GET /api/v1/slots/locate/:plate
     Locate a parked vehicle with full details including fee estimate.
     Changed from POST to GET — this is a read operation (no side effects).

     Returns: { data: { slot details + parkedFor + estimatedFee + currentRate } }
     ──────────────────────────────────────────────────────────────────── */
  router.get('/slots/locate/:plate', optionalAuth, async (req, res) => {
    try {
      const vehicleNumber = req.params.plate;
      if (!vehicleNumber || vehicleNumber.trim().length < 2) {
        return errorResponse(res, 400, 'ValidationError', 'Vehicle number must be at least 2 characters.', {
          field: 'plate',
          value: vehicleNumber,
        });
      }

      const escaped = vehicleNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const slot = await Slot.findOne({
        vehicleNumber: { $regex: new RegExp(`^${escaped}$`, 'i') },
        status: 'Occupied',
      }).lean();

      if (!slot) {
        return errorResponse(res, 404, 'NotFound', 'Vehicle not found in the parking lot.');
      }

      const now = new Date();
      const durationMin  = Math.round((now - new Date(slot.entryTime)) / 1000 / 60);
      const dynamicRate  = await getDynamicRate(slot.zone);
      const hours        = Math.max(1, Math.ceil(durationMin / 60));
      const estimatedFee = hours * dynamicRate;

      return successResponse(res, {
        found: true,
        slotNumber:    slot.slotNumber,
        zone:          slot.zone,
        zoneLabel:     slot.zoneLabel,
        floor:         slot.floor || 1,
        vehicleNumber: slot.vehicleNumber,
        vehicleType:   slot.vehicleType,
        entryTime:     slot.entryTime,
        parkedFor:     `${durationMin} min`,
        estimatedFee:  `₹${estimatedFee}`,
        currentRate:   `₹${dynamicRate}/hr`,
      });
    } catch (err) {
      return errorResponse(res, 500, 'InternalError', err.message);
    }
  });


  /* ────────────────────────────────────────────────────────────────────
     GET /api/v1/slots/analytics
     Dashboard analytics — restricted to service_provider and admin.

     Returns occupancy heatmap, revenue breakdown, avg duration, etc.
     ──────────────────────────────────────────────────────────────────── */
  router.get('/slots/analytics',
    authMiddleware,
    requireRole('admin', 'service_provider'),
    async (_req, res) => {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Run aggregation queries in parallel for performance
        const [occupancy, revenue, heatmap, avgResult, vehicleHistory, totalParked, totalSlots, revenueToday] =
          await Promise.all([
            // Hourly occupancy distribution
            Transaction.aggregate([
              { $match: { entryTime: { $gte: sevenDaysAgo } } },
              { $group: { _id: { $hour: '$entryTime' }, count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
              { $project: { _id: 0, hour: '$_id', count: 1 } },
            ]),
            // Daily revenue
            Transaction.aggregate([
              { $match: { exitTime: { $gte: sevenDaysAgo }, fee: { $ne: null } } },
              { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$exitTime' } }, total: { $sum: '$fee' } } },
              { $sort: { _id: 1 } },
              { $project: { _id: 0, date: '$_id', total: 1 } },
            ]),
            // Slot usage heatmap
            Transaction.aggregate([
              { $group: { _id: '$slotNumber', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
              { $project: { _id: 0, slot: '$_id', count: 1 } },
            ]),
            // Average duration
            Transaction.aggregate([
              { $match: { durationMinutes: { $ne: null } } },
              { $group: { _id: null, avg: { $avg: '$durationMinutes' } } },
            ]),
            // Recent vehicle history
            Transaction.find({ exitTime: { $ne: null } })
              .sort({ exitTime: -1 }).limit(50)
              .select('vehicleNumber vehicleType slotNumber zone entryTime exitTime durationMinutes fee')
              .lean(),
            // Current occupancy
            Slot.countDocuments({ status: 'Occupied' }),
            Slot.countDocuments(),
            // Today's revenue
            (() => {
              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);
              return Transaction.aggregate([
                { $match: { exitTime: { $gte: todayStart }, fee: { $ne: null } } },
                { $group: { _id: null, total: { $sum: '$fee' } } },
              ]);
            })(),
          ]);

        // Dynamic pricing info
        const multiplier = 1 + (totalParked / Math.max(totalSlots, 1));

        return successResponse(res, {
          occupancy,
          revenue,
          heatmap,
          vehicleHistory,
          avgDuration:  Math.round(avgResult[0]?.avg || 0),
          totalParked,
          totalSlots,
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
      } catch (err) {
        return errorResponse(res, 500, 'InternalError', err.message);
      }
    }
  );


  /* ────────────────────────────────────────────────────────────────────
     GET /api/v1/slots/:slotNumber
     Get a single slot by slot number.

     Returns: { data: Slot }
     ──────────────────────────────────────────────────────────────────── */
  router.get('/slots/:slotNumber', optionalAuth, async (req, res) => {
    try {
      const slotNumber = parseInt(req.params.slotNumber, 10);
      if (isNaN(slotNumber) || slotNumber < 1) {
        return errorResponse(res, 400, 'ValidationError', 'slotNumber must be a positive integer.', {
          field: 'slotNumber',
          value: req.params.slotNumber,
        });
      }

      const slot = await Slot.findOne({ slotNumber }).lean();
      if (!slot) {
        return errorResponse(res, 404, 'NotFound', `Slot ${slotNumber} does not exist.`);
      }

      return successResponse(res, slot);
    } catch (err) {
      return errorResponse(res, 500, 'InternalError', err.message);
    }
  });


  /* ────────────────────────────────────────────────────────────────────
     PATCH /api/v1/slots/:slotNumber/status
     Update slot status (e.g., mark as Reserved).
     Restricted to service_provider and admin roles.

     Body: { status: 'Reserved' | 'Free' }
     Returns: { data: Slot }
     ──────────────────────────────────────────────────────────────────── */
  router.patch('/slots/:slotNumber/status',
    authMiddleware,
    requireRole('admin', 'service_provider'),
    async (req, res) => {
      try {
        const slotNumber = parseInt(req.params.slotNumber, 10);
        const { status } = req.body;

        if (!status || !['Free', 'Reserved'].includes(status)) {
          return errorResponse(res, 400, 'ValidationError',
            'status must be "Free" or "Reserved". Use park/unpark endpoints for Occupied status.', {
              field: 'status',
              value: status,
              allowed: ['Free', 'Reserved'],
            });
        }

        const slot = await Slot.findOne({ slotNumber });
        if (!slot) {
          return errorResponse(res, 404, 'NotFound', `Slot ${slotNumber} does not exist.`);
        }

        if (slot.status === 'Occupied') {
          return errorResponse(res, 409, 'Conflict',
            `Slot ${slotNumber} is currently occupied. Unpark the vehicle first.`);
        }

        // Update status
        slot.status = status;
        if (status === 'Free') {
          slot.vehicleNumber = null;
          slot.vehicleType = null;
          slot.entryTime = null;
          // Re-add to heap
          heaps[slot.zone].insert(slotNumber);
        }
        await slot.save();

        await broadcast();
        return successResponse(res, slot.toObject());
      } catch (err) {
        return errorResponse(res, 500, 'InternalError', err.message);
      }
    }
  );


  /* ────────────────────────────────────────────────────────────────────
     POST /api/v1/slots/park
     Park a vehicle using MinHeap-based nearest-slot allocation.

     Body: { vehicleNumber, vehicleType, zone? }
     Returns: 201 { data: { message, slotNumber, zone, entryTime, currentRate } }
     ──────────────────────────────────────────────────────────────────── */
  router.post('/slots/park', optionalAuth, async (req, res) => {
    try {
      const { vehicleNumber, vehicleType, zone: requestedZone } = req.body;

      // ── Input validation ──
      if (!vehicleNumber || !vehicleType) {
        return errorResponse(res, 400, 'ValidationError',
          'vehicleNumber and vehicleType are required.', {
            fields: {
              vehicleNumber: vehicleNumber ? 'ok' : 'missing',
              vehicleType:   vehicleType ? 'ok' : 'missing',
            },
          });
      }

      if (!VALID_VEHICLE_TYPES.includes(vehicleType)) {
        return errorResponse(res, 400, 'ValidationError',
          `Invalid vehicleType. Allowed: ${VALID_VEHICLE_TYPES.join(', ')}`, {
            field: 'vehicleType',
            value: vehicleType,
            allowed: VALID_VEHICLE_TYPES,
          });
      }

      // ── Resolve zone ──
      const zone = requestedZone && heaps[requestedZone] ? requestedZone : typeToZone[vehicleType];
      if (!zone) {
        return errorResponse(res, 400, 'ValidationError',
          `Cannot determine zone for vehicle type: ${vehicleType}`);
      }

      // ── Check duplicate ──
      const existing = await Slot.findOne({ vehicleNumber, status: 'Occupied' });
      if (existing) {
        return errorResponse(res, 409, 'Conflict',
          `Vehicle ${vehicleNumber} is already parked at Slot ${existing.slotNumber} (Zone ${existing.zone}).`, {
            slotNumber: existing.slotNumber,
            zone: existing.zone,
          });
      }

      // ── MinHeap allocation (O(log n)) ──
      const heap = heaps[zone];
      const slotNumber = heap.extractMin();
      if (slotNumber === null) {
        return errorResponse(res, 409, 'Conflict',
          `Zone ${zone} is full! No available slots.`, {
            zone,
            suggestion: 'Try another zone or wait for a slot to free up.',
          });
      }

      const entryTime = new Date();
      const dynamicRate = await getDynamicRate(zone);

      await Slot.findOneAndUpdate(
        { slotNumber },
        { status: 'Occupied', vehicleNumber, vehicleType, entryTime }
      );

      await Transaction.create({
        vehicleNumber, vehicleType, slotNumber, zone, entryTime,
      });

      await broadcast();

      return successResponse(res, {
        message:     `Vehicle parked at Zone ${zone}, Slot ${slotNumber}.`,
        slotNumber,
        zone,
        entryTime,
        currentRate: `₹${dynamicRate}/hr`,
      }, null, 201);
    } catch (err) {
      return errorResponse(res, 500, 'InternalError', err.message);
    }
  });


  /* ────────────────────────────────────────────────────────────────────
     POST /api/v1/slots/unpark
     Remove a vehicle from the parking lot. Calculates duration & fee.

     Body: { vehicleNumber }
     Returns: { data: { message, slotNumber, zone, duration, hours, ratePerHour, fee } }
     ──────────────────────────────────────────────────────────────────── */
  router.post('/slots/unpark', optionalAuth, async (req, res) => {
    try {
      const { vehicleNumber } = req.body;

      if (!vehicleNumber) {
        return errorResponse(res, 400, 'ValidationError',
          'vehicleNumber is required.', {
            field: 'vehicleNumber',
          });
      }

      const slot = await Slot.findOne({ vehicleNumber, status: 'Occupied' });
      if (!slot) {
        return errorResponse(res, 404, 'NotFound',
          `Vehicle "${vehicleNumber}" not found in the parking lot.`);
      }

      const exitTime    = new Date();
      const durationMs  = exitTime - slot.entryTime;
      const durationMin = durationMs / 1000 / 60;

      // Dynamic pricing at time of exit
      const dynamicRate = await getDynamicRate(slot.zone);
      const hours = Math.max(1, Math.ceil(durationMin / 60));
      const fee   = hours * dynamicRate;

      // Free the slot
      await Slot.findOneAndUpdate(
        { slotNumber: slot.slotNumber },
        { status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null }
      );

      // Return slot number to heap
      heaps[slot.zone].insert(slot.slotNumber);

      // Close the transaction
      await Transaction.findOneAndUpdate(
        { vehicleNumber, exitTime: null },
        { exitTime, durationMinutes: Math.round(durationMin), fee },
        { sort: { entryTime: -1 } }
      );

      await broadcast();

      return successResponse(res, {
        message:    `Vehicle removed from Zone ${slot.zone}, Slot ${slot.slotNumber}.`,
        slotNumber: slot.slotNumber,
        zone:       slot.zone,
        duration:   `${Math.round(durationMin)} min`,
        hours,
        ratePerHour: `₹${dynamicRate}/hr`,
        fee:         `₹${fee}`,
      });
    } catch (err) {
      return errorResponse(res, 500, 'InternalError', err.message);
    }
  });



  /* ────────────────────────────────────────────────────────────────────
     GET /api/v1/transactions
     List parking transactions with pagination & filtering.
     Restricted to service_provider and admin.

     Query params:
       ?vehicleNumber=UP92  Filter by plate (partial)
       ?zone=A              Filter by zone
       ?status=active       'active' (no exitTime) or 'completed'
       ?page=1              Page number
       ?pageSize=20         Items per page
       ?sort=entryTime      Sort field
       ?order=desc          Sort direction

     Returns: { data: Transaction[], meta: { total, page, pageSize, ... } }
     ──────────────────────────────────────────────────────────────────── */
  router.get('/transactions',
    authMiddleware,
    requireRole('admin', 'service_provider'),
    async (req, res) => {
      try {
        const {
          vehicleNumber, zone, status,
          sort = 'entryTime',
          order = 'desc',
          page = '1',
          pageSize = '20',
        } = req.query;

        const filter = {};
        if (vehicleNumber) filter.vehicleNumber = { $regex: new RegExp(vehicleNumber, 'i') };
        if (zone && VALID_ZONES.includes(zone)) filter.zone = zone;
        if (status === 'active')    filter.exitTime = null;
        if (status === 'completed') filter.exitTime = { $ne: null };

        const p  = Math.max(1, parseInt(page, 10) || 1);
        const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
        const skip = (p - 1) * ps;
        const sortDir = order === 'desc' ? -1 : 1;

        const [transactions, total] = await Promise.all([
          Transaction.find(filter).sort({ [sort]: sortDir }).skip(skip).limit(ps).lean(),
          Transaction.countDocuments(filter),
        ]);

        return paginatedResponse(res, transactions, total, p, ps);
      } catch (err) {
        return errorResponse(res, 500, 'InternalError', err.message);
      }
    }
  );


  /* ────────────────────────────────────────────────────────────────────
     GET /api/v1/transactions/:id
     Get a single transaction by MongoDB _id.
     Restricted to service_provider and admin.

     Returns: { data: Transaction }
     ──────────────────────────────────────────────────────────────────── */
  router.get('/transactions/:id',
    authMiddleware,
    requireRole('admin', 'service_provider'),
    async (req, res) => {
      try {
        const txn = await Transaction.findById(req.params.id).lean();
        if (!txn) {
          return errorResponse(res, 404, 'NotFound', 'Transaction not found.');
        }
        return successResponse(res, txn);
      } catch (err) {
        // Invalid ObjectId format
        if (err.name === 'CastError') {
          return errorResponse(res, 400, 'ValidationError', 'Invalid transaction ID format.');
        }
        return errorResponse(res, 500, 'InternalError', err.message);
      }
    }
  );


  return router;
};

