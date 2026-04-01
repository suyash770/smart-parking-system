/**
 * ══════════════════════════════════════════════════════════════
 *  Transaction Model — MongoDB Schema (Mongoose 8)
 *  Derived from ARCHITECTURE.md § 8 ERD: TRANSACTION entity
 *
 *  Architecture Pattern: Event Log (Immutable Append)
 *  ─────────────────────────────────────────────────────────────
 *  ERD:                         Schema:
 *  ┌──────────────────────┐    ┌──────────────────────────────┐
 *  │ TRANSACTION          │──► │ Transaction (Mongoose Model) │
 *  │ _id PK               │    │ + Immutable entry fields     │
 *  │ vehicleNumber        │    │ + Exit fields (set on close) │
 *  │ vehicleType          │    │ + virtual: isActive          │
 *  │ slotNumber           │    │ + virtual: durationHuman     │
 *  │ entryTime            │    │ + instance: close()          │
 *  │ exitTime (nullable)  │    │ + static: todayRevenue()     │
 *  │ durationMinutes      │    │ + static: hourlyOccupancy()  │
 *  │ fee (nullable)       │    │ + static: revenueByDay()     │
 *  └──────────────────────┘    │ + static: slotHeatmap()      │
 *                              └──────────────────────────────┘
 *
 *  ERD Relationship: SLOT ||--o{ TRANSACTION : "generates"
 *  ERD Relationship: USER ||--o{ TRANSACTION : "may initiate (future)"
 *
 *  Design rationale:
 *  - Transactions are an EVENT LOG — entry fields are immutable
 *  - exitTime/fee are set exactly once when the vehicle leaves
 *  - Analytics methods are statics on the model (co-located with data)
 * ══════════════════════════════════════════════════════════════
 */
const mongoose = require('mongoose');

/* ── Constants ── */
const ZONES = ['A', 'B', 'C'];


/* ══════════════════════════════════════════════════════════════
   SCHEMA DEFINITION
   ══════════════════════════════════════════════════════════════ */
const transactionSchema = new mongoose.Schema({
  /* ── Entry Fields (set at park time, immutable after) ── */
  vehicleNumber: {
    type:      String,
    required:  [true, 'Vehicle number is required'],
    trim:      true,
    uppercase: true,
    maxlength: [20, 'Vehicle number too long'],
  },
  vehicleType: {
    type:     String,
    required: [true, 'Vehicle type is required'],
  },
  slotNumber: {
    type:     Number,
    required: [true, 'Slot number is required'],
    min:      [1, 'Slot number must be >= 1'],
  },
  zone: {
    type:    String,
    enum:    { values: [...ZONES, null], message: 'Zone must be A, B, or C' },
    default: null,
  },
  entryTime: {
    type:     Date,
    required: [true, 'Entry time is required'],
    default:  Date.now,
  },

  /* ── Exit Fields (set when vehicle leaves, null while parked) ── */
  exitTime: {
    type:    Date,
    default: null,
  },
  durationMinutes: {
    type:    Number,
    default: null,
    min:     [0, 'Duration cannot be negative'],
  },
  fee: {
    type:    Number,
    default: null,
    min:     [0, 'Fee cannot be negative'],
  },

  /* ── Future: Link to User who initiated the parking (ERD relationship) ── */
  userId: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'User',
    default: null,
  },
}, {
  timestamps: true,   // createdAt, updatedAt
  collection: 'transactions',
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
});


/* ══════════════════════════════════════════════════════════════
   INDEXES — Optimized for analytics aggregation queries
   ══════════════════════════════════════════════════════════════ */

// Analytics: hourly occupancy, revenue by day (range scans on time)
transactionSchema.index({ entryTime: 1 });
transactionSchema.index({ exitTime: 1 });

// Unpark lookup: find active (unexited) transaction for a vehicle
transactionSchema.index({ vehicleNumber: 1, exitTime: 1 });

// Heatmap: aggregate by slot
transactionSchema.index({ slotNumber: 1 });

// Zone-based analytics
transactionSchema.index({ zone: 1, entryTime: 1 });

// User history (future)
transactionSchema.index({ userId: 1, entryTime: -1 });


/* ══════════════════════════════════════════════════════════════
   VIRTUALS — Computed properties
   ══════════════════════════════════════════════════════════════ */

/** Is this transaction still active (vehicle is still parked)? */
transactionSchema.virtual('isActive').get(function () {
  return this.exitTime === null;
});

/** Human-readable duration string */
transactionSchema.virtual('durationHuman').get(function () {
  if (this.durationMinutes === null) return null;
  const h = Math.floor(this.durationMinutes / 60);
  const m = this.durationMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
});

/** Human-readable fee string */
transactionSchema.virtual('feeDisplay').get(function () {
  if (this.fee === null) return null;
  return `₹${this.fee}`;
});

/** Slot display label (e.g., "A-1") */
transactionSchema.virtual('slotLabel').get(function () {
  return this.zone ? `${this.zone}-${this.slotNumber}` : `Slot ${this.slotNumber}`;
});


/* ══════════════════════════════════════════════════════════════
   INSTANCE METHODS — Domain behavior
   ══════════════════════════════════════════════════════════════ */

/**
 * Close this transaction (vehicle has left).
 * Sets exitTime, calculates duration and fee.
 *
 * @param {number} fee - The calculated parking fee
 * @returns {Promise<Transaction>} The closed transaction
 * @throws {Error} If transaction is already closed
 */
transactionSchema.methods.close = async function (fee) {
  if (this.exitTime) {
    throw new Error(`Transaction ${this._id} is already closed`);
  }
  this.exitTime        = new Date();
  this.durationMinutes = Math.round((this.exitTime - this.entryTime) / 1000 / 60);
  this.fee             = fee;
  return this.save();
};


/* ══════════════════════════════════════════════════════════════
   STATIC METHODS — Analytics & aggregation queries
   Co-located with the data model for maintainability
   ══════════════════════════════════════════════════════════════ */

/**
 * Get today's total revenue.
 * @returns {Promise<number>} Total revenue today in ₹
 */
transactionSchema.statics.todayRevenue = async function () {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const result = await this.aggregate([
    { $match: { exitTime: { $gte: todayStart }, fee: { $ne: null } } },
    { $group: { _id: null, total: { $sum: '$fee' } } },
  ]);
  return result[0]?.total || 0;
};

/**
 * Get hourly occupancy distribution (last 7 days).
 * Returns: [{ hour: 0-23, count }]
 */
transactionSchema.statics.hourlyOccupancy = async function (days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.aggregate([
    { $match: { entryTime: { $gte: since } } },
    { $group: { _id: { $hour: '$entryTime' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, hour: '$_id', count: 1 } },
  ]);
};

/**
 * Get daily revenue breakdown (last N days).
 * Returns: [{ date: "2026-03-29", total: 1500 }]
 */
transactionSchema.statics.revenueByDay = async function (days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.aggregate([
    { $match: { exitTime: { $gte: since }, fee: { $ne: null } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$exitTime' } },
      total: { $sum: '$fee' },
      count: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', total: 1, count: 1 } },
  ]);
};

/**
 * Get slot usage heatmap (all time).
 * Returns: [{ slot: 1, count: 42 }]
 */
transactionSchema.statics.slotHeatmap = function () {
  return this.aggregate([
    { $group: { _id: '$slotNumber', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, slot: '$_id', count: 1 } },
  ]);
};

/**
 * Get average parking duration (completed transactions).
 * @returns {Promise<number>} Average duration in minutes
 */
transactionSchema.statics.avgDuration = async function () {
  const result = await this.aggregate([
    { $match: { durationMinutes: { $ne: null } } },
    { $group: { _id: null, avg: { $avg: '$durationMinutes' } } },
  ]);
  return Math.round(result[0]?.avg || 0);
};

/**
 * Get recent completed transactions.
 * @param {number} limit - Max number of results
 * @returns {Promise<Transaction[]>}
 */
transactionSchema.statics.recentHistory = function (limit = 50) {
  return this.find({ exitTime: { $ne: null } })
    .sort({ exitTime: -1 })
    .limit(limit)
    .select('vehicleNumber vehicleType slotNumber zone entryTime exitTime durationMinutes fee')
    .lean();
};

/**
 * Find the active (unexited) transaction for a vehicle.
 * @param {string} vehicleNumber
 * @returns {Promise<Transaction|null>}
 */
transactionSchema.statics.findActive = function (vehicleNumber) {
  return this.findOne({
    vehicleNumber: vehicleNumber.toUpperCase(),
    exitTime: null,
  }).sort({ entryTime: -1 });
};

/**
 * Get full analytics dashboard data in a single call.
 * Runs all aggregation queries in parallel for performance.
 *
 * @returns {Promise<Object>} Complete analytics payload
 */
transactionSchema.statics.getDashboard = async function () {
  const [occupancy, revenue, heatmap, avgDur, vehicleHistory, revenueToday] =
    await Promise.all([
      this.hourlyOccupancy(),
      this.revenueByDay(),
      this.slotHeatmap(),
      this.avgDuration(),
      this.recentHistory(),
      this.todayRevenue(),
    ]);

  return {
    occupancy,
    revenue,
    heatmap,
    vehicleHistory,
    avgDuration: avgDur,
    revenueToday,
  };
};


/* ══════════════════════════════════════════════════════════════
   EXPORTS
   ══════════════════════════════════════════════════════════════ */
module.exports = mongoose.model('Transaction', transactionSchema);
