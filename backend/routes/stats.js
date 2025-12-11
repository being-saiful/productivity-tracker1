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
    
    // Load roadmap only when needed (inside handler to avoid circular dependency)
    const ROADMAPS = {
      programmer: [
        'Code at least 45 minutes.',
        'Solve 1–2 coding problems.',
        'Read docs or articles for 15 minutes.',
        'Work on a personal project feature.',
        'Refactor or review yesterday\'s code.',
        'Write a short technical note or log.',
        'Push code or save progress to Git.',
        'Plan what you will code tomorrow.',
      ],
      writer: [
        'Write 500 focused words.',
        'Edit or revise at least one page.',
        'Read 10 pages of quality writing.',
        'Brainstorm 3 new ideas or titles.',
        'Outline your next piece.',
        'Polish and proofread one paragraph.',
        'Share or publish something weekly.',
        'Reflect on your writing process.',
      ],
      designer: [
        'Create or iterate on one design.',
        'Get feedback from colleagues or users.',
        'Study design trends or best practices.',
        'Work on a personal design project.',
        'Update your portfolio with new work.',
        'Write about your design process.',
        'Collaborate with developers or marketers.',
        'Review and improve old designs.',
      ],
      teacher: [
        'Plan lessons for tomorrow.',
        'Create or update learning materials.',
        'Review student work or assignments.',
        'Participate in professional development.',
        'Communicate with parents or guardians.',
        'Organize classroom or digital resources.',
        'Prepare assessments or quizzes.',
        'Reflect on today\'s teaching.',
      ],
      manager: [
        'Check in with 3+ team members.',
        'Review and provide feedback on work.',
        'Plan next sprint or project phase.',
        'Address team blockers.',
        'Schedule 1-on-1s.',
        'Update status reports.',
        'Strategize on long-term goals.',
        'Celebrate team wins.',
      ],
      generic: [
        'Complete 2 main tasks.',
        'Spend 1 hour focused work.',
        'Review and plan your day.',
        'Take a 15-minute break.',
        'Help or support someone.',
        'Learn something new.',
        'Organize or prioritize.',
        'Reflect on progress.',
      ],
    };
    const careerId = user.career_id || 'generic';
    const totalTasks = (ROADMAPS[careerId] || ROADMAPS.generic).length;

    // Insert the stats row and then re-query it (SQLite may not support .returning())
    await db('stats').insert({
      user_id: req.user.id,
      date: dateKey,
      focused_minutes: 0,
      tasks_completed: 0,
      total_tasks: totalTasks,
      completed_task_ids: JSON.stringify([]),
    });
    // Re-query by user_id and date to get the created row
    stats = await db('stats').where({ user_id: req.user.id, date: dateKey }).first();
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
      .filter(app => Boolean(app.is_productive))
      .reduce((sum, app) => sum + app.minutes_used, 0);
    
    appUsageProductivityPercent = totalMinutes > 0
      ? Math.round((productiveMinutes / totalMinutes) * 100)
      : 0;
  }

  // Compute combined productivity score
  const checklistScore = stats.total_tasks > 0 ? (stats.tasks_completed / stats.total_tasks) : 0; // 0..1
  const focusScore = Math.min((stats.focused_minutes || 0) / 60, 1); // normalized to 0..1 (60min -> 1)
  const appScore = appUsageProductivityPercent / 100; // 0..1

  // Formula: Final Score = ((Checklist*0.7 + Focus*0.3) * 0.8) + (AppUsage*0.2)
  const intermediate = (checklistScore * 0.7) + (focusScore * 0.3);
  const finalScore = Math.round(((intermediate * 0.8) + (appScore * 0.2)) * 100);

  res.json({ 
    stats, 
    activityLogs: logs,
    appUsage: appUsage || [],
    breakdown: {
      checklistPercent: Math.round(checklistScore * 100),
      focusPercent: Math.round(focusScore * 100),
      appUsagePercent: appUsageProductivityPercent,
    },
    productivityPercent: finalScore,
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
    // Define roadmap steps locally to avoid circular dependency
    const ROADMAPS = {
      programmer: [
        'Code at least 45 minutes.',
        'Solve 1–2 coding problems.',
        'Read docs or articles for 15 minutes.',
        'Work on a personal project feature.',
        'Refactor or review yesterday\'s code.',
        'Write a short technical note or log.',
        'Push code or save progress to Git.',
        'Plan what you will code tomorrow.',
      ],
      writer: [
        'Write 500 focused words.',
        'Edit or revise at least one page.',
        'Read 10 pages of quality writing.',
        'Brainstorm 3 new ideas or titles.',
        'Outline your next piece.',
        'Polish and proofread one paragraph.',
        'Share or publish something weekly.',
        'Reflect on your writing process.',
      ],
      designer: [
        'Create or iterate on one design.',
        'Get feedback from colleagues or users.',
        'Study design trends or best practices.',
        'Work on a personal design project.',
        'Update your portfolio with new work.',
        'Write about your design process.',
        'Collaborate with developers or marketers.',
        'Review and improve old designs.',
      ],
      teacher: [
        'Plan lessons for tomorrow.',
        'Create or update learning materials.',
        'Review student work or assignments.',
        'Participate in professional development.',
        'Communicate with parents or guardians.',
        'Organize classroom or digital resources.',
        'Prepare assessments or quizzes.',
        'Reflect on today\'s teaching.',
      ],
      manager: [
        'Check in with 3+ team members.',
        'Review and provide feedback on work.',
        'Plan next sprint or project phase.',
        'Address team blockers.',
        'Schedule 1-on-1s.',
        'Update status reports.',
        'Strategize on long-term goals.',
        'Celebrate team wins.',
      ],
      generic: [
        'Complete 2 main tasks.',
        'Spend 1 hour focused work.',
        'Review and plan your day.',
        'Take a 15-minute break.',
        'Help or support someone.',
        'Learn something new.',
        'Organize or prioritize.',
        'Reflect on progress.',
      ],
    };
    const careerId = req.user.career_id || 'generic';
    const steps = ROADMAPS[careerId] || ROADMAPS.generic;

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
        // ignore malformed JSON and treat as empty
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

    // Recompute productivity with current app usage
    const appUsageNow2 = await db('app_usage').where({ user_id: req.user.id, date: dateKey });
    const totalMinutesNow2 = appUsageNow2.reduce((sum, a) => sum + a.minutes_used, 0);
    const productiveMinutesNow2 = appUsageNow2.filter(a => Boolean(a.is_productive)).reduce((s, a) => s + a.minutes_used, 0);
    const appUsageProductivityPercentNow2 = totalMinutesNow2 > 0 ? Math.round((productiveMinutesNow2 / totalMinutesNow2) * 100) : 0;

    const checklistScoreV = updated.total_tasks > 0 ? (updated.tasks_completed / updated.total_tasks) : 0;
    const focusScoreV = Math.min((updated.focused_minutes || 0) / 60, 1);
    const appScoreV = appUsageProductivityPercentNow2 / 100;
    const intermediateV = (checklistScoreV * 0.7) + (focusScoreV * 0.3);
    const finalScoreV = Math.round(((intermediateV * 0.8) + (appScoreV * 0.2)) * 100);

    return res.json({
      stats: updated,
      breakdown: {
        checklistPercent: Math.round(checklistScoreV * 100),
        focusPercent: Math.round(focusScoreV * 100),
        appUsagePercent: appUsageProductivityPercentNow2,
      },
      productivityPercent: finalScoreV,
    });
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
