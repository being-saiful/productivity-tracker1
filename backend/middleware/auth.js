// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('../db');

module.exports = async function (req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db('users').where({ id: payload.id }).first();
    if (!user) throw new Error('User not found');
    req.user = user; // attach to request
    next();
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: 'Invalid token' });
  }
};
