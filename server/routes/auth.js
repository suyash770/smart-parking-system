const express = require('express');
const User    = require('../models/User');
const { PUBLIC_ROLES } = require('../models/User');
const { signToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

/* ─────────────────────────────────────────────
   POST /api/auth/register
   Body: { name, email, password, role? }
   ───────────────────────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists (uses model static)
    const exists = await User.emailExists(email);
    if (exists) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Only allow public roles via registration (admin must be seeded)
    const userRole = PUBLIC_ROLES.includes(role) ? role : 'user';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password, // Will be hashed by the pre-save hook
      role: userRole,
    });

    const token = signToken(user);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────
   POST /api/auth/login
   Body: { email, password }
   ───────────────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user by email (select:'+password' via static method)
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare password using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);

    res.json({
      message: 'Login successful.',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────
   POST /api/auth/admin-login
   Body: { email, password }
   Only allows admin-role users
   ───────────────────────────────────────────── */
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Uses model static that filters by admin role + selects password
    const user = await User.findAdmin(email);
    if (!user) {
      // Intentionally vague error to not reveal whether admin exists
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = signToken(user);

    res.json({
      message: 'Admin login successful.',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────
   GET /api/auth/me
   Returns currently authenticated user info
   ───────────────────────────────────────────── */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
