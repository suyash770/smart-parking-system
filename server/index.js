require('dotenv').config();
const express    = require('express');
const http       = require('http');
const mongoose   = require('mongoose');
const cors       = require('cors');
const { Server } = require('socket.io');

const MinHeap       = require('./utils/MinHeap');
const Slot          = require('./models/Slot');
const User          = require('./models/User');
const parkingRoutes       = require('./routes/parking');
const parkingCompatRoutes = require('./routes/parking-compat');
const authRoutes          = require('./routes/auth');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

/* ──────────────────────────────────────────────────────────
   Zone-based MinHeaps (one per vehicle type)
   Zone A → Bikes   (slots 1-6)
   Zone B → Cars    (slots 7-14)
   Zone C → Trucks  (slots 15-20)
   ────────────────────────────────────────────────────────── */
const heaps = {
  A: new MinHeap(),   // Bikes
  B: new MinHeap(),   // Cars
  C: new MinHeap(),   // Trucks
};

const ZONE_CONFIG = [
  { zone: 'A', label: 'Bikes',  start: 1,  end: 6  },
  { zone: 'B', label: 'Cars',   start: 7,  end: 14 },
  { zone: 'C', label: 'Trucks', start: 15, end: 20 },
];

const TYPE_TO_ZONE = {
  Bike:  'A',
  Car:   'B',
  SUV:   'B',
  Van:   'B',
  Truck: 'C',
};

async function bootstrap() {
  // 1. Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  MongoDB connected');

  // 2. Seed slots if empty (drop old format if needed)
  const count = await Slot.countDocuments();
  const hasZone = count > 0 ? await Slot.findOne({ zone: { $exists: true, $ne: null } }) : null;

  if (count === 0 || !hasZone) {
    // Drop old data and reseed with zones
    await Slot.deleteMany({});
    const docs = [];
    for (const cfg of ZONE_CONFIG) {
      for (let i = cfg.start; i <= cfg.end; i++) {
        docs.push({ slotNumber: i, zone: cfg.zone, zoneLabel: cfg.label, status: 'Free' });
      }
    }
    await Slot.insertMany(docs);
    console.log(`🅿️  Seeded ${docs.length} parking slots across ${ZONE_CONFIG.length} zones`);
  }

  // 3. Load free slots into the correct zone heaps
  for (const cfg of ZONE_CONFIG) {
    const freeSlots = await Slot.find({ zone: cfg.zone, status: 'Free' }).sort({ slotNumber: 1 });
    freeSlots.forEach(s => heaps[cfg.zone].insert(s.slotNumber));
    console.log(`🔢  Zone ${cfg.zone} (${cfg.label}) heap: ${heaps[cfg.zone].size()} free`);
  }

  // 4. Seed default admin account if none exists
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    await User.create({
      name: 'Admin',
      email: 'admin@smartpark.com',
      password: 'Admin@123',
      role: 'admin',
    });
    console.log('👑  Default admin seeded: admin@smartpark.com / Admin@123');
  }

  // 5. Mount routes (inject heaps map, TYPE_TO_ZONE, and io)
  app.use('/api/auth', authRoutes);

  // ── New v1 API (resource-oriented, structured responses) ──
  //    e.g. GET /api/v1/slots, POST /api/v1/slots/park
  app.use('/api/v1', parkingRoutes(heaps, TYPE_TO_ZONE, io));

  // ── Backward compatibility for existing frontend ──
  //    Preserves old /api/slots, /api/park etc. with flat response format
  app.use('/api', parkingCompatRoutes(heaps, TYPE_TO_ZONE, io));

  // 5. Socket.io
  io.on('connection', async (socket) => {
    console.log(`🔌  Client connected: ${socket.id}`);
    const slots = await Slot.find().sort({ slotNumber: 1 }).lean();
    socket.emit('slotsUpdated', slots);
  });

  // 6. Listen
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('❌  Failed to start server:', err);
  process.exit(1);
});
