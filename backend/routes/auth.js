// backend/routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

function signToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// ── SIGN‑UP ───────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: 'Name, email and password required' });
  }
  const exists = await db('users')
    .where({ email: email.toLowerCase() })
    .first();
  if (exists) return res.status(409).json({ error: 'Email already used' });

  const hash = await bcrypt.hash(password, 12);
  const ids = await db('users')
    .insert({
      name,
      email: email.toLowerCase(),
      password_hash: hash,
    });

  // SQLite returns last insert id in ids array or uses lastID
  const userId = Array.isArray(ids) && ids[0] ? ids[0] : ids;
  const user = await db('users').where({ id: userId }).first();
  
  if (!user) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
  
  const token = signToken(user);
  res.json({ token, user: omitSensitive(user) });
});

// ── LOGIN ───────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db('users')
    .where({ email: email.toLowerCase() })
    .first();

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user);
  res.json({ token, user: omitSensitive(user) });
});

/**
 * Strip password_hash before sending anything back to the client.
 */
function omitSensitive(user) {
  const { password_hash: _password_hash, ...rest } = user;
  return rest;
}

module.exports = router;
