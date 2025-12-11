// backend/routes/app_usage.js
// Track app usage and integrate with ML classification for productivity scoring

const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.use(auth);

// Helper – UTC date string
function todayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY‑MM‑DD
}

/**
 * POST /api/app_usage/log
 * Log app usage time for the current user
 * Body: { app_name: string, minutes_used: number, category?: string }
 */
router.post('/log', async (req, res) => {
  const { app_name, minutes_used = 0, category = null } = req.body;
  
  if (!app_name || minutes_used <= 0) {
    return res.status(400).json({ error: 'app_name and minutes_used are required' });
  }

  const dateKey = todayKey();
  
  try {
    // Upsert: update if exists, insert if not
    const existing = await db('app_usage')
      .where({ user_id: req.user.id, date: dateKey, app_name })
      .first();

    if (existing) {
      // Update existing record
      await db('app_usage')
        .where({ id: existing.id })
        .update({
          minutes_used: existing.minutes_used + minutes_used,
          category: category || existing.category,
          last_updated: db.fn.now(),
        });
    } else {
      // Insert new record
        await db('app_usage').insert({
          user_id: req.user.id,
          date: dateKey,
          app_name,
          minutes_used,
          category,
          classification_attempts: 0,
          next_retry_at: null,
          last_classification_error: null,
        });
    }

    // QUICK HEURISTIC: classify common apps synchronously so UI reflects changes immediately
    try {
      const nameLc = (app_name || '').toLowerCase();
      const productiveHintsSync = ['vscode', 'vs code', 'code', 'terminal', 'git', 'python', 'node', 'intellij', 'pycharm', 'notion', 'figma', 'photoshop', 'word', 'excel', 'powerpoint'];
      const unproductiveHintsSync = ['youtube', 'tiktok', 'twitter', 'facebook', 'instagram', 'reddit', 'netflix', 'discord', 'tinder', 'snapchat'];
      let syncIsProductive = null;
      let syncConfidence = 0;
      if (productiveHintsSync.some(h => nameLc.includes(h))) {
        syncIsProductive = true;
        syncConfidence = 0.6;
      } else if (unproductiveHintsSync.some(h => nameLc.includes(h))) {
        syncIsProductive = false;
        syncConfidence = 0.6;
      }

      if (syncIsProductive !== null) {
        // Persist synchronous heuristic classification so frontend can show updates immediately
        await db('app_usage')
          .where({ user_id: req.user.id, date: dateKey, app_name })
          .update({
            is_productive: syncIsProductive,
            productivity_score: Math.round(syncConfidence * 100),
            last_classification_error: null,
            classification_attempts: 0,
            next_retry_at: null,
            last_updated: db.fn.now(),
          });
      }
    } catch (syncErr) {
      console.warn('Synchronous heuristic classification failed:', syncErr && syncErr.message ? syncErr.message : syncErr);
    }

    // After logging, attempt to classify the app (ML service) and update DB.
    // If ML is unavailable we apply a simple heuristic fallback.
    (async function classifyAndUpdate() {
      try {
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const resp = await fetch(`${mlServiceUrl}/classify/app`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_name, category, career: req.user.career_id || 'general' }),
        });

        let is_productive = null;
        let confidence = 0;
        let mlError = null;
        if (resp.ok) {
          const json = await resp.json();
          is_productive = json.is_productive;
          confidence = json.confidence || 0;
        }

        // If ML couldn't decide, use heuristic
        if (is_productive === null || typeof is_productive === 'undefined') {
          const name = (app_name || '').toLowerCase();
          const productiveHints = ['vscode', 'vs code', 'code', 'terminal', 'git', 'python', 'node', 'intellij', 'pycharm', 'notion', 'figma', 'photoshop', 'word', 'excel', 'powerpoint'];
          const unproductiveHints = ['youtube', 'tiktok', 'twitter', 'facebook', 'instagram', 'reddit', 'netflix', 'discord', 'tinder', 'snapchat'];

          if (productiveHints.some(h => name.includes(h))) {
            is_productive = true;
            confidence = 0.6;
          } else if (unproductiveHints.some(h => name.includes(h))) {
            is_productive = false;
            confidence = 0.6;
          } else {
            // leave null so worker can retry using ML later
            is_productive = null;
            confidence = 0;
          }
        }

        // Update DB with classification result if we have a value
        // Persist classification and update retry metadata
        const updatePayload = {
          last_updated: db.fn.now(),
        };
        if (is_productive !== null) {
          updatePayload.is_productive = is_productive;
          updatePayload.productivity_score = Math.round(confidence * 100);
          updatePayload.last_classification_error = null;
          updatePayload.classification_attempts = 0;
          updatePayload.next_retry_at = null;
        } else {
          // record that an ML attempt happened (so worker can backoff/retry)
          updatePayload.classification_attempts = db.raw('coalesce(classification_attempts, 0) + 1');
          // schedule a retry in exponential backoff (handled by worker, here set a small delay)
          updatePayload.next_retry_at = db.raw('datetime(\'now\', \'+1 minute\')');
          updatePayload.last_classification_error = mlError || 'no classification (heuristic not matched)';
        }

        await db('app_usage')
          .where({ user_id: req.user.id, date: dateKey, app_name })
          .update(updatePayload);
      } catch (err) {
        // Swallow errors from background classify — logging only
        console.error('Background classify failed:', err && err.message ? err.message : err);
      }
    })();

    // Return the created/updated app_usage row so client can immediately reflect changes
    try {
      const appRow = await db('app_usage')
        .where({ user_id: req.user.id, date: dateKey, app_name })
        .first();

      return res.json({ success: true, message: `Logged ${minutes_used} minutes for ${app_name}`, app: appRow });
    } catch (rErr) {
      return res.json({ success: true, message: `Logged ${minutes_used} minutes for ${app_name}` });
    }
  } catch (e) {
    console.error('Error logging app usage:', e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/app_usage/classify
 * Classify app usage as productive/unproductive using ML model
 * Body: { app_name: string, category?: string }
 */
router.post('/classify', async (req, res) => {
  const { app_name, category = 'Unknown' } = req.body;
  
  if (!app_name) {
    return res.status(400).json({ error: 'app_name is required' });
  }

  try {
    // Call the ML service to classify the app
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    let is_productive = null;
    let confidence = 0;

    try {
      const response = await fetch(`${mlServiceUrl}/classify/app`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_name, category, career: req.user.career_id || 'general' }),
      });

      if (response.ok) {
        const mlResult = await response.json();
        is_productive = mlResult.is_productive;
        confidence = mlResult.confidence || 0;
      }
    } catch (innerErr) {
      console.warn('ML service call failed, falling back to heuristic:', innerErr && innerErr.message ? innerErr.message : innerErr);
    }

    // Heuristic fallback when ML not available or returned null
    if (is_productive === null || typeof is_productive === 'undefined') {
      const name = (app_name || '').toLowerCase();
      const productiveHints = ['vscode', 'vs code', 'code', 'terminal', 'git', 'python', 'node', 'intellij', 'pycharm', 'notion', 'figma', 'photoshop', 'word', 'excel', 'powerpoint'];
      const unproductiveHints = ['youtube', 'tiktok', 'twitter', 'facebook', 'instagram', 'reddit', 'netflix', 'discord', 'tinder', 'snapchat'];

      if (productiveHints.some(h => name.includes(h))) {
        is_productive = true;
        confidence = 0.6;
      } else if (unproductiveHints.some(h => name.includes(h))) {
        is_productive = false;
        confidence = 0.6;
      } else {
        is_productive = null;
        confidence = 0;
      }
    }

    // Persist the classification for today's record if present
    try {
      const dateKey = todayKey();
      await db('app_usage')
        .where({ user_id: req.user.id, date: dateKey, app_name })
        .update({ is_productive, productivity_score: Math.round(confidence * 100), last_updated: db.fn.now() });
    } catch (dbErr) {
      // non-fatal
      console.warn('Failed to persist classification:', dbErr && dbErr.message ? dbErr.message : dbErr);
    }

    return res.json({ app_name, is_productive, confidence, category });
  } catch (e) {
    console.error('Error classifying app:', e);
    return res.json({ app_name, is_productive: null, confidence: 0, category, error: e.message });
  }
});

/**
 * GET /api/app_usage/today
 * Get today's app usage breakdown
 */
router.get('/today', async (req, res) => {
  const dateKey = todayKey();

  try {
    const apps = await db('app_usage')
      .where({ user_id: req.user.id, date: dateKey })
      .orderBy('minutes_used', 'desc');

    const totalMinutes = apps.reduce((sum, app) => sum + app.minutes_used, 0);
    const productiveMinutes = apps
      .filter(app => Boolean(app.is_productive))
      .reduce((sum, app) => sum + app.minutes_used, 0);

    const productivityPercent = totalMinutes > 0 
      ? Math.round((productiveMinutes / totalMinutes) * 100) 
      : 0;

    return res.json({
      date: dateKey,
      total_minutes: totalMinutes,
      productive_minutes: productiveMinutes,
      productivity_percent: productivityPercent,
      apps: apps.map(app => ({
        app_name: app.app_name,
        minutes_used: app.minutes_used,
        is_productive: app.is_productive,
        productivity_score: app.productivity_score,
        category: app.category,
        percent_of_day: totalMinutes > 0 ? Math.round((app.minutes_used / totalMinutes) * 100) : 0,
      })),
    });
  } catch (e) {
    console.error('Error fetching app usage:', e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/app_usage/weekly
 * Get weekly app usage summary
 */
router.get('/weekly', async (req, res) => {
  try {
    // Get last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().slice(0, 10);

    const apps = await db('app_usage')
      .where('user_id', req.user.id)
      .where('date', '>=', startDate)
      .select('app_name', 'is_productive')
      .sum('minutes_used as total_minutes')
      .groupBy('app_name', 'is_productive')
      .orderBy('total_minutes', 'desc');

    const totalMinutes = apps.reduce((sum, app) => sum + app.total_minutes, 0);
    const productiveMinutes = apps
      .filter(app => Boolean(app.is_productive))
      .reduce((sum, app) => sum + app.total_minutes, 0);

    return res.json({
      period: `${startDate} to today`,
      total_minutes: totalMinutes,
      productive_minutes: productiveMinutes,
      weekly_productivity_percent: totalMinutes > 0 
        ? Math.round((productiveMinutes / totalMinutes) * 100) 
        : 0,
      apps: apps.map(app => ({
        app_name: app.app_name,
        total_minutes: app.total_minutes,
        is_productive: app.is_productive,
        percent_of_week: totalMinutes > 0 ? Math.round((app.total_minutes / totalMinutes) * 100) : 0,
      })),
    });
  } catch (e) {
    console.error('Error fetching weekly app usage:', e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;

// Background worker: classify any app_usage rows where is_productive IS NULL
async function classifyRecord(record) {
  const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  let is_productive = null;
  let confidence = 0;

  try {
    const response = await fetch(`${mlServiceUrl}/classify/app`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_name: record.app_name, category: record.category || '', career: record.career || 'general' }),
    });

    if (response.ok) {
      const mlResult = await response.json();
      is_productive = mlResult.is_productive;
      confidence = mlResult.confidence || 0;
    }
  } catch (err) {
    // noop — we'll fall back to heuristic below
  }

  // Heuristic fallback
  if (is_productive === null || typeof is_productive === 'undefined') {
    const name = (record.app_name || '').toLowerCase();
    const productiveHints = ['vscode', 'vs code', 'code', 'terminal', 'git', 'python', 'node', 'intellij', 'pycharm', 'notion', 'figma', 'photoshop', 'word', 'excel', 'powerpoint'];
    const unproductiveHints = ['youtube', 'tiktok', 'twitter', 'facebook', 'instagram', 'reddit', 'netflix', 'discord', 'tinder', 'snapchat'];

    if (productiveHints.some(h => name.includes(h))) {
      is_productive = true;
      confidence = 0.6;
    } else if (unproductiveHints.some(h => name.includes(h))) {
      is_productive = false;
      confidence = 0.6;
    } else {
      is_productive = null;
      confidence = 0;
    }
  }

  if (is_productive !== null) {
    await db('app_usage')
      .where({ id: record.id })
      .update({ is_productive, productivity_score: Math.round(confidence * 100), last_updated: db.fn.now() });
  }
}

function startClassificationWorker(intervalMs = 60 * 1000) {
  // run once immediately, then every interval
  const run = async () => {
    try {
      const pending = await db('app_usage').whereNull('is_productive').limit(20);
      if (pending && pending.length > 0) {
        for (const rec of pending) {
          try {
            await classifyRecord(rec);
          } catch (inner) {
            console.warn('Worker classify error for', rec.id, inner && inner.message ? inner.message : inner);
          }
        }
      }
    } catch (err) {
      console.error('Classification worker failed:', err && err.message ? err.message : err);
    }
  };

  run();
  const id = setInterval(run, intervalMs);
  return () => clearInterval(id);
}

// attach worker starter to router export so index.js can start it
router.startClassificationWorker = startClassificationWorker;
