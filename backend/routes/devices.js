// backend/routes/devices.js
const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');
const { generateCode } = require('../utils/codeGenerator');

router.use(auth);

// POST /api/devices/generateCode – 6‑digit, 5‑min expiry
router.post('/generateCode', async (req, res) => {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  await db('device_codes').insert({
    code,
    user_id: req.user.id,
    expires_at: expiresAt,
    used: false,
  });
  res.json({ code });
});

// POST /api/devices/link  { code, name }
router.post('/link', async (req, res) => {
  const { code, name } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'code and name required' });
  }
  const linkRecord = await db('device_codes')
    .where({ code })
    .first();

  if (!linkRecord) {
    return res.status(404).json({ error: 'Invalid code' });
  }
  if (linkRecord.used) {
    return res.status(410).json({ error: 'Code already used' });
  }
  if (new Date(linkRecord.expires_at) < new Date()) {
    return res.status(410).json({ error: 'Code expired' });
  }

  // Create the device row
  const [deviceId] = await db('devices')
    .insert({
      user_id: req.user.id,
      name,
    })
    .returning('id');

  // Mark code as used
  await db('device_codes')
    .where({ id: linkRecord.id })
    .update({ used: true });

  const device = await db('devices')
    .where({ id: deviceId })
    .first();

  res.json({ device });
});

// GET /api/devices – list all linked devices for the user
router.get('/', async (req, res) => {
  const devices = await db('devices')
    .where({ user_id: req.user.id })
    .orderBy('linked_at', 'desc');
  res.json({ devices });
});

// DELETE /api/devices/:id – unlink a device
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db('devices')
    .where({ id, user_id: req.user.id })
    .del();
  res.json({ success: true });
});

module.exports = router;
