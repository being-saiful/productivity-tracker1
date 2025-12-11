// backend/routes/stats.js (UPDATED with app usage integration)
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
 * GET /api/stats/today (UPDATED)
 *   - Creates a row for today if none exists
 *   - Now includes app usage data for comprehensive productivity scoring
 */
router.get('/today', async (req, res) => {
  const dateKey = todayKey();

  let stats = await db('stats')
    .where({ user_id: req.user.id, date: dateKey })
    .first();

  if (!stats) {
    // Get the user's career to set total_tasks
    const user = await db('users')
      .where({ id: req.user.id })
      .first();
    
    const roadmap = require('../routes/roadmap').ROADMAPS;
    const careerId = user.career_id || 'generic';
    const totalTasks = (roadmap[careerId] || roadmap.generic).length;

    const ids = await db('stats')
      .insert({
        user_id: req.user.id,
        date: dateKey,
        focused_minutes: 0,
        tasks_completed: 0,
        total_tasks: totalTasks,
        completed_task_ids: JSON.stringify([]),
      })
      .returning('id');
    const statsId = Array.isArray(ids) && ids[0] ? ids[0] : ids;
    stats = await db('stats').where({ id: statsId }).first();
  }

  // Pull activity logs for the UI
  const logs = await db('activity_logs')
    .where({ stats_id: stats.id })
    .orderBy('timestamp', 'desc');

  // Ensure completed_task_ids is always a string
  if (!stats.completed_task_ids) {
    stats.completed_task_ids = JSON.stringify([]);
  }

  // NEW: Get app usage data for app-based productivity scoring
  const appUsage = await db('app_usage')
    .where({ user_id: req.user.id, date: dateKey });

  // Calculate app usage productivity percentage
  let appUsageProductivityPercent = 0;
  if (appUsage && appUsage.length > 0) {
    const totalMinutes = appUsage.reduce((sum, app) => sum + app.minutes_used, 0);
    const productiveMinutes = appUsage
      .filter(app => app.is_productive === true)
      .reduce((sum, app) => sum + app.minutes_used, 0);
    
    appUsageProductivityPercent = totalMinutes > 0
      ? Math.round((productiveMinutes / totalMinutes) * 100)
      : 0;
  }

  res.json({ 
    stats, 
    activityLogs: logs,
    appUsage: appUsage || [],
    appUsageProductivityPercent,
  });
});

/**
 * PATCH /api/stats/today (unchanged)
 *   Body: { action: 'completeTask'|'addFocus', index?:number, minutes?:number }
 */
router.patch('/today', async (req, res) => {
  const { action, index, minutes } = req.body;
  const dateKey = todayKey();

  const stats = await db('stats')
    .where({ user_id: req.user.id, date: dateKey })
    .first();

  if (!stats) {
    return res.status(404).json({ error: 'Stats not found for today' });
  }

  // -----------------------------------------------------------------
  // 1️⃣ Complete / un‑complete a checklist item
  // -----------------------------------------------------------------
  if (action === 'completeTask') {
    // fetch roadmap steps from static list – we reuse the same data
    const roadmap = require('../routes/roadmap').ROADMAPS;
    const careerId = req.user.career_id || 'generic';
    const steps = roadmap[careerId] || roadmap.generic;

    const stepId = `step-${index}`;

    // get or create the completedTaskIds field (stored as JSON string)
    let completed = [];
    const raw = await db('stats')
      .where({ id: stats.id })
      .first('completed_task_ids');

    if (raw && raw.completed_task_ids) {
      try {
        completed = JSON.parse(raw.completed_task_ids);
      } catch (err) {
        // ignore malformed JSON and continue with empty list
      }
    }

    const already = completed.includes(stepId);
    if (already) {
      completed = completed.filter((c) => c !== stepId);
      await db('stats')
        .where({ id: stats.id })
        .update({
          tasks_completed: Math.max(stats.tasks_completed - 1, 0),
          completed_task_ids: JSON.stringify(completed),
        });
    } else {
      completed.push(stepId);
      await db('stats')
        .where({ id: stats.id })
        .update({
          tasks_completed: Math.min(
            stats.tasks_completed + 1,
            steps.length
          ),
          completed_task_ids: JSON.stringify(completed),
        });

      // Log activity
      await db('activity_logs').insert({
        stats_id: stats.id,
        type: 'checklist',
        title: 'Completed habit',
        detail: steps[index],
        minutes: 0,
        timestamp: Date.now(),
      });
    }

    const updated = await db('stats')
      .where({ id: stats.id })
      .first();

    // Ensure completed_task_ids is always a string
    if (!updated.completed_task_ids) {
      updated.completed_task_ids = JSON.stringify([]);
    }

    return res.json({ stats: updated });
  }

  // -----------------------------------------------------------------
  // 2️⃣ Add focus minutes (from timer)
  // -----------------------------------------------------------------
  if (action === 'addFocus') {
    const inc = Math.max(1, Math.round(minutes));
    await db('stats')
      .where({ id: stats.id })
      .increment('focused_minutes', inc);

    // Log activity
    await db('activity_logs').insert({
      stats_id: stats.id,
      type: 'timer',
      title: 'Focus session',
      detail: `${inc} min logged`,
      minutes: inc,
      timestamp: Date.now(),
    });

    const updated = await db('stats')
      .where({ id: stats.id })
      .first();

    // Ensure completed_task_ids is always a string
    if (!updated.completed_task_ids) {
      updated.completed_task_ids = JSON.stringify([]);
    }

    return res.json({ stats: updated });
  }

  res.status(400).json({ error: 'Invalid action' });
});

/**
 * GET /api/stats/history?date=YYYY-MM-DD
 */
router.get('/history', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });

  const stats = await db('stats')
    .where({ user_id: req.user.id, date })
    .first();

  if (!stats) {
    return res.json({ message: 'No data for this date' });
  }

  const logs = await db('activity_logs')
    .where({ stats_id: stats.id })
    .orderBy('timestamp', 'desc');

  res.json({ ...stats, activityLogs: logs });
});

module.exports = router;
