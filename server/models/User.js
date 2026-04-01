/**
 * ══════════════════════════════════════════════════════════════
 *  User Model — MongoDB Schema (Mongoose 8)
 *  Derived from ARCHITECTURE.md § 8 ERD: USER entity
 *
 *  Architecture Pattern: Active Record with Security Hooks
 *  ─────────────────────────────────────────────────────────────
 *  ERD:                         Schema:
 *  ┌─────────────────────┐     ┌──────────────────────────────┐
 *  │ USER                │ ──► │ User (Mongoose Model)        │
 *  │ _id PK              │     │ + bcrypt pre-save hook       │
 *  │ name                │     │ + instance: comparePassword  │
 *  │ email (unique)      │     │ + instance: hasRole          │
 *  │ password (hashed)   │     │ + static: findByEmail        │
 *  │ role (enum)         │     │ + toJSON: strips password    │
 *  │ createdAt           │     │ + virtual: isAdmin           │
 *  │ updatedAt           │     │ + virtual: displayRole       │
 *  └─────────────────────┘     └──────────────────────────────┘
 *
 *  ADR-005: JWT for Authentication — bcrypt + jsonwebtoken
 *  RBAC Roles: user → service_provider → admin
 * ══════════════════════════════════════════════════════════════
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

/* ── Constants (Domain Knowledge) ── */
const SALT_ROUNDS  = 10;
const ROLES        = ['user', 'service_provider', 'admin'];
const PUBLIC_ROLES = ['user', 'service_provider']; // Roles allowed via public registration

/** Role hierarchy for permission checks (higher = more access) */
const ROLE_HIERARCHY = {
  user:             1,
  service_provider: 2,
  admin:            3,
};


/* ══════════════════════════════════════════════════════════════
   SCHEMA DEFINITION
   ══════════════════════════════════════════════════════════════ */
const userSchema = new mongoose.Schema({
  /* ── Identity ── */
  name: {
    type:      String,
    required:  [true, 'Name is required'],
    trim:      true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must be <= 100 characters'],
  },

  /* ── Authentication ── */
  email: {
    type:      String,
    required:  [true, 'Email is required'],
    unique:    true,
    lowercase: true,
    trim:      true,
    match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  password: {
    type:      String,
    required:  [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select:    false,  // Never include password in queries by default
  },

  /* ── Authorization (RBAC) ── */
  role: {
    type:    String,
    enum:    { values: ROLES, message: `Role must be one of: ${ROLES.join(', ')}` },
    default: 'user',
  },

  /* ── Profile (future extensibility) ── */
  phone: {
    type:    String,
    default: null,
    trim:    true,
  },
  lastLoginAt: {
    type:    Date,
    default: null,
  },
  isActive: {
    type:    Boolean,
    default: true,
  },
}, {
  timestamps: true,   // Adds createdAt, updatedAt from ERD
  collection: 'users',
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
});


/* ══════════════════════════════════════════════════════════════
   INDEXES
   ══════════════════════════════════════════════════════════════ */

// Role-based queries (e.g., find all admins, count service providers)
userSchema.index({ role: 1 });

// Active user lookups
userSchema.index({ isActive: 1 });


/* ══════════════════════════════════════════════════════════════
   VIRTUALS — Computed properties
   ══════════════════════════════════════════════════════════════ */

/** Is this user an admin? */
userSchema.virtual('isAdmin').get(function () {
  return this.role === 'admin';
});

/** Is this user a service provider or higher? */
userSchema.virtual('isProvider').get(function () {
  return ROLE_HIERARCHY[this.role] >= ROLE_HIERARCHY.service_provider;
});

/** Human-readable role display */
userSchema.virtual('displayRole').get(function () {
  const labels = {
    user: 'User',
    service_provider: 'Service Provider',
    admin: 'Administrator',
  };
  return labels[this.role] || this.role;
});


/* ══════════════════════════════════════════════════════════════
   PRE-SAVE HOOK — Password hashing with bcrypt + salt
   Architecture: Security at the model layer, not the route layer
   ══════════════════════════════════════════════════════════════ */
userSchema.pre('save', async function (next) {
  // Only hash if password has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});


/* ══════════════════════════════════════════════════════════════
   INSTANCE METHODS — Domain behavior
   ══════════════════════════════════════════════════════════════ */

/**
 * Compare a candidate password against the stored hash.
 * @param {string} candidatePassword - Plaintext password to check
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if this user has a specific role or higher.
 * Uses the role hierarchy: user < service_provider < admin.
 *
 * @param {string} requiredRole - Minimum required role
 * @returns {boolean}
 */
userSchema.methods.hasRole = function (requiredRole) {
  return (ROLE_HIERARCHY[this.role] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
};

/**
 * Record a login event (update lastLoginAt).
 * @returns {Promise<User>}
 */
userSchema.methods.recordLogin = async function () {
  this.lastLoginAt = new Date();
  return this.save();
};

/**
 * Sanitized JSON output — strips password from all JSON responses.
 * @returns {Object} User data without sensitive fields
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};


/* ══════════════════════════════════════════════════════════════
   STATIC METHODS — Collection-level queries
   ══════════════════════════════════════════════════════════════ */

/**
 * Find a user by email address (case-insensitive).
 * Includes the password field for authentication.
 *
 * @param {string} email
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

/**
 * Find a user by email, restricted to admin role only.
 * Used for admin-login endpoint (intentionally vague errors).
 *
 * @param {string} email
 * @returns {Promise<User|null>}
 */
userSchema.statics.findAdmin = function (email) {
  return this.findOne({ email: email.toLowerCase(), role: 'admin' }).select('+password');
};

/**
 * Check if an email is already registered.
 * @param {string} email
 * @returns {Promise<boolean>}
 */
userSchema.statics.emailExists = async function (email) {
  const count = await this.countDocuments({ email: email.toLowerCase() });
  return count > 0;
};

/**
 * Get user statistics by role.
 * @returns {Promise<{total, byRole: {user, service_provider, admin}}>}
 */
userSchema.statics.getStats = async function () {
  const result = await this.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);
  const byRole = result.reduce((acc, r) => {
    acc[r._id] = r.count;
    return acc;
  }, {});
  return {
    total: Object.values(byRole).reduce((a, b) => a + b, 0),
    byRole,
  };
};


/* ══════════════════════════════════════════════════════════════
   EXPORTS
   ══════════════════════════════════════════════════════════════ */
const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.ROLES        = ROLES;
module.exports.PUBLIC_ROLES = PUBLIC_ROLES;
module.exports.ROLE_HIERARCHY = ROLE_HIERARCHY;
