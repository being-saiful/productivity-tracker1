// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const roadmapRoutes = require('./routes/roadmap');
const statsRoutes = require('./routes/stats');
const deviceRoutes = require('./routes/devices');
const appUsageRoutes = require('./routes/app_usage');

const app = express();

app.use(cors());                         // allow SPA on another origin if needed
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public'))); // serve index.html

// ── API ────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/app_usage', appUsageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// catch‑all for client‑side routing (if you ever move to SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API listening on http://localhost:${PORT}`));

// Start background workers (non-blocking)
try {
  if (appUsageRoutes && typeof appUsageRoutes.startClassificationWorker === 'function') {
    appUsageRoutes.startClassificationWorker();
    console.log('Classification worker started');
  }
} catch (err) {
  console.warn('Failed to start classification worker:', err && err.message ? err.message : err);
}
