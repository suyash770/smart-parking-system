/**
 * ══════════════════════════════════════════════════════════════
 *  Slot Model — MongoDB Schema (Mongoose 8)
 *  Derived from ARCHITECTURE.md § 8 ERD: SLOT entity
 *
 *  Architecture Pattern: Active Record with Rich Domain Model
 *  ─────────────────────────────────────────────────────────────
 *  ERD:                         Schema:
 *  ┌─────────────────────┐     ┌──────────────────────────────┐
 *  │ SLOT                │ ──► │ Slot (Mongoose Model)        │
 *  │ slotNumber PK       │     │ + zone config                │
 *  │ zone (A|B|C)        │     │ + status state machine       │
 *  │ zoneLabel            │     │ + virtual: isAvailable       │
 *  │ status              │     │ + instance: park()           │
 *  │ vehicleNumber       │     │ + instance: unpark()         │
 *  │ vehicleType         │     │ + instance: reserve()        │
 *  │ entryTime           │     │ + static: findByVehicle()    │
 *  └─────────────────────┘     │ + static: getOccupancy()     │
 *                              └──────────────────────────────┘
 *
 *  ADR-002: MongoDB chosen for flexible schema & aggregation pipeline
 *  ADR-003: Slot allocation via MinHeap, not DB queries
 * ══════════════════════════════════════════════════════════════
 */
const mongoose = require('mongoose');

/* ── Constants (Domain Knowledge) ── */
const ZONES        = ['A', 'B', 'C'];
const ZONE_LABELS  = { A: 'Bikes', B: 'Cars', C: 'Trucks' };
const STATUSES     = ['Free', 'Occupied', 'Reserved'];
const VEHICLE_TYPES = ['Bike', 'Scooter', 'Car', 'SUV', 'Van', 'Truck'];

/* ── Zone → Slot Range Configuration ── */
const ZONE_CONFIG = {
  A: { start: 1,  end: 6,  label: 'Bikes',  baseRate: 10 },
  B: { start: 7,  end: 14, label: 'Cars',   baseRate: 30 },
  C: { start: 15, end: 20, label: 'Trucks', baseRate: 50 },
};


/* ══════════════════════════════════════════════════════════════
   SCHEMA DEFINITION
   ══════════════════════════════════════════════════════════════ */
const slotSchema = new mongoose.Schema({
  /* ── Identity ── */
  slotNumber: {
    type:     Number,
    required: [true, 'Slot number is required'],
    unique:   true,
    min:      [1, 'Slot number must be >= 1'],
    max:      [100, 'Slot number must be <= 100'],
    immutable: true,  // Slot numbers never change once created
  },

  /* ── Zone Classification ── */
  zone: {
    type:     String,
    enum:     { values: ZONES, message: 'Zone must be one of: A, B, C' },
    required: [true, 'Zone is required'],
    immutable: true,  // Slots don't move between zones
  },
  zoneLabel: {
    type:    String,
    default: function () { return ZONE_LABELS[this.zone] || ''; },
  },

  /* ── Physical Location ── */
  floor: {
    type:    Number,
    default: 1,
    min:     1,
    max:     5,
  },

  /* ── Status (State Machine: Free ↔ Reserved ↔ Occupied) ── */
  status: {
    type:    String,
    enum:    { values: STATUSES, message: 'Status must be: Free, Occupied, or Reserved' },
    default: 'Free',
  },

  /* ── Vehicle Info (populated when Occupied) ── */
  vehicleNumber: {
    type:      String,
    default:   null,
    trim:      true,
    uppercase: true,   // Normalize: "up92j7764" → "UP92J7764"
    maxlength: [20, 'Vehicle number too long'],
  },
  vehicleType: {
    type:    String,
    enum:    { values: [...VEHICLE_TYPES, null], message: `Vehicle type must be one of: ${VEHICLE_TYPES.join(', ')}` },
    default: null,
  },

  /* ── Timestamps ── */
  entryTime: {
    type:    Date,
    default: null,
  },
}, {
  timestamps: true,   // Adds createdAt, updatedAt automatically
  collection: 'slots',
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
});


/* ══════════════════════════════════════════════════════════════
   INDEXES — Optimized for the app's query patterns
   ══════════════════════════════════════════════════════════════ */

// Primary: heap rebuild on server restart → find Free slots per zone, sorted
slotSchema.index({ zone: 1, status: 1, slotNumber: 1 });

// Vehicle lookup: search/locate by plate while parked
slotSchema.index({ vehicleNumber: 1, status: 1 });

// Floor filtering: UI filters by floor
slotSchema.index({ floor: 1 });


/* ══════════════════════════════════════════════════════════════
   VIRTUALS — Computed properties (not stored in DB)
   Architecture Pattern: Rich Domain Model with behavior
   ══════════════════════════════════════════════════════════════ */

/** Is this slot available for parking? */
slotSchema.virtual('isAvailable').get(function () {
  return this.status === 'Free';
});

/** How long has the current vehicle been parked (minutes)? */
slotSchema.virtual('parkedMinutes').get(function () {
  if (!this.entryTime || this.status !== 'Occupied') return 0;
  return Math.round((Date.now() - this.entryTime.getTime()) / 1000 / 60);
});

/** Base rate for this slot's zone (₹/hr) */
slotSchema.virtual('baseRate').get(function () {
  return ZONE_CONFIG[this.zone]?.baseRate || 0;
});

/** Slot display label (e.g., "A-1", "B-7", "C-15") */
slotSchema.virtual('displayLabel').get(function () {
  return `${this.zone}-${this.slotNumber}`;
});


/* ══════════════════════════════════════════════════════════════
   INSTANCE METHODS — Domain behavior on individual slots
   Architecture Pattern: Rich Domain Model (not Anemic)
   ══════════════════════════════════════════════════════════════ */

/**
 * Park a vehicle in this slot.
 * Enforces state machine: only Free → Occupied is valid.
 *
 * @param {string} vehicleNumber - License plate
 * @param {string} vehicleType  - Vehicle type enum
 * @returns {Promise<Slot>} The updated slot document
 * @throws {Error} If slot is not Free
 */
slotSchema.methods.park = async function (vehicleNumber, vehicleType) {
  if (this.status !== 'Free') {
    throw new Error(`Cannot park: Slot ${this.slotNumber} is ${this.status}`);
  }
  this.status        = 'Occupied';
  this.vehicleNumber = vehicleNumber;
  this.vehicleType   = vehicleType;
  this.entryTime     = new Date();
  return this.save();
};

/**
 * Remove a vehicle from this slot.
 * Enforces state machine: only Occupied → Free is valid.
 *
 * @returns {Promise<{slot: Slot, duration: number}>} Updated slot and duration in minutes
 * @throws {Error} If slot is not Occupied
 */
slotSchema.methods.unpark = async function () {
  if (this.status !== 'Occupied') {
    throw new Error(`Cannot unpark: Slot ${this.slotNumber} is ${this.status}`);
  }
  const durationMin = this.parkedMinutes;
  this.status        = 'Free';
  this.vehicleNumber = null;
  this.vehicleType   = null;
  this.entryTime     = null;
  await this.save();
  return { slot: this, duration: durationMin };
};

/**
 * Reserve/unreserve this slot (admin/service_provider action).
 * Enforces: Free ↔ Reserved (cannot reserve an Occupied slot).
 *
 * @param {boolean} reserved - true to reserve, false to unreserve
 * @returns {Promise<Slot>} The updated slot document
 * @throws {Error} If transition is invalid
 */
slotSchema.methods.setReserved = async function (reserved) {
  if (reserved && this.status !== 'Free') {
    throw new Error(`Cannot reserve: Slot ${this.slotNumber} is ${this.status}`);
  }
  if (!reserved && this.status !== 'Reserved') {
    throw new Error(`Cannot unreserve: Slot ${this.slotNumber} is ${this.status}`);
  }
  this.status = reserved ? 'Reserved' : 'Free';
  return this.save();
};


/* ══════════════════════════════════════════════════════════════
   STATIC METHODS — Collection-level domain queries
   Architecture Pattern: Repository methods on the model
   ══════════════════════════════════════════════════════════════ */

/**
 * Find a parked vehicle by license plate (case-insensitive, exact match).
 * @param {string} plate - Full or partial license plate
 * @returns {Promise<Slot|null>}
 */
slotSchema.statics.findByVehicle = function (plate) {
  const escaped = plate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return this.findOne({
    vehicleNumber: { $regex: new RegExp(`^${escaped}$`, 'i') },
    status: 'Occupied',
  }).lean();
};

/**
 * Search for a vehicle by partial plate match.
 * @param {string} partial - Partial plate string
 * @returns {Promise<Slot|null>}
 */
slotSchema.statics.searchByPlate = function (partial) {
  return this.findOne({
    vehicleNumber: { $regex: new RegExp(partial, 'i') },
    status: 'Occupied',
  }).lean();
};

/**
 * Get current occupancy statistics across all zones.
 * @returns {Promise<{total, free, occupied, reserved, occupancyRate, byZone}>}
 */
slotSchema.statics.getOccupancy = async function () {
  const [stats, byZone] = await Promise.all([
    this.aggregate([
      {
        $group: {
          _id: null,
          total:    { $sum: 1 },
          free:     { $sum: { $cond: [{ $eq: ['$status', 'Free'] }, 1, 0] } },
          occupied: { $sum: { $cond: [{ $eq: ['$status', 'Occupied'] }, 1, 0] } },
          reserved: { $sum: { $cond: [{ $eq: ['$status', 'Reserved'] }, 1, 0] } },
        },
      },
    ]),
    this.aggregate([
      {
        $group: {
          _id:      '$zone',
          total:    { $sum: 1 },
          free:     { $sum: { $cond: [{ $eq: ['$status', 'Free'] }, 1, 0] } },
          occupied: { $sum: { $cond: [{ $eq: ['$status', 'Occupied'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const s = stats[0] || { total: 0, free: 0, occupied: 0, reserved: 0 };
  return {
    ...s,
    occupancyRate: s.total > 0 ? Math.round((s.occupied / s.total) * 100) : 0,
    byZone: byZone.reduce((acc, z) => {
      acc[z._id] = { total: z.total, free: z.free, occupied: z.occupied };
      return acc;
    }, {}),
  };
};

/**
 * Get the count of free slots in a specific zone.
 * @param {string} zone - Zone identifier (A, B, or C)
 * @returns {Promise<number>}
 */
slotSchema.statics.freeInZone = function (zone) {
  return this.countDocuments({ zone, status: 'Free' });
};


/* ══════════════════════════════════════════════════════════════
   PRE-SAVE MIDDLEWARE — Auto-populate zoneLabel from zone
   ══════════════════════════════════════════════════════════════ */
slotSchema.pre('save', function (next) {
  if (this.isModified('zone') && !this.zoneLabel) {
    this.zoneLabel = ZONE_LABELS[this.zone] || '';
  }
  next();
});


/* ══════════════════════════════════════════════════════════════
   EXPORTS
   ══════════════════════════════════════════════════════════════ */
const Slot = mongoose.model('Slot', slotSchema);

// Export model + constants for use in routes and seeding
module.exports = Slot;
module.exports.ZONES        = ZONES;
module.exports.ZONE_LABELS  = ZONE_LABELS;
module.exports.ZONE_CONFIG  = ZONE_CONFIG;
module.exports.STATUSES     = STATUSES;
module.exports.VEHICLE_TYPES = VEHICLE_TYPES;
