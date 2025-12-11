// backend/routes/user.js
const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.use(auth); // all routes below require a valid JWT

// ── GET current user (with preferences) ───────────────────────────────
router.get('/me', async (req, res) => {
  const user = await db('users')
    .where({ id: req.user.id })
    .first();

  const apps = await db('user_apps')
    .where({ user_id: req.user.id })
    .pluck('app_name');

  res.json({ ...omitSensitive(user), apps });
});

// ── UPDATE career ───────────────────────────────────────────────────
router.put('/career', async (req, res) => {
  const { careerId } = req.body;
  await db('users')
    .where({ id: req.user.id })
    .update({ career_id: careerId, updated_at: db.fn.now() });
  res.json({ success: true });
});

// ── UPDATE level ───────────────────────────────────────────────────
router.put('/level', async (req, res) => {
  const { level } = req.body;
  await db('users')
    .where({ id: req.user.id })
    .update({ level, updated_at: db.fn.now() });
  res.json({ success: true });
});

// ── UPDATE daily minutes ───────────────────────────────────────────
router.put('/dailyMinutes', async (req, res) => {
  const { minutes } = req.body;
  await db('users')
    .where({ id: req.user.id })
    .update({ daily_minutes: minutes, updated_at: db.fn.now() });
  res.json({ success: true });
});

// ── UPDATE productive apps list ──────────────────────────────────────
router.put('/apps', async (req, res) => {
  const { apps } = req.body; // array of strings
  if (!Array.isArray(apps))
    return res.status(400).json({ error: 'Apps must be an array' });

  // wipe old list & insert new
  await db('user_apps')
    .where({ user_id: req.user.id })
    .del();

  const rows = apps.map((a) => ({
    user_id: req.user.id,
    app_name: a,
  }));
  if (rows.length) await db('user_apps').insert(rows);
  res.json({ success: true });
});

function omitSensitive(user) {
  const { password_hash: _password_hash, ...rest } = user;
  return rest;
}

module.exports = router;
