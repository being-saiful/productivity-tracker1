// backend/routes/roadmap.js
const router = require('express').Router();
const auth = require('../middleware/auth');

// The same static data you already have in the front‑end
const ROADMAPS = {
  programmer: [
    'Code at least 45 minutes.',
    'Solve 1–2 coding problems.',
    'Read docs or articles for 15 minutes.',
    'Work on a personal project feature.',
    'Refactor or review yesterday’s code.',
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
    'Reflect on todays teaching.',
  ],
  manager: [
    'Check in with 3+ team members.',
    'Review and provide feedback on work.',
    'Plan next sprint or project phase.',
    'Address one team concern or issue.',
    'Update stakeholders on progress.',
    'Remove blockers for your team.',
    'Prepare for upcoming meetings.',
    'Review team goals and metrics.',
  ],
  student: [
    'Complete assigned readings or notes.',
    'Work on one major assignment.',
    'Attend classes or lectures.',
    'Study for at least 45 minutes.',
    'Review difficult concepts.',
    'Prepare questions for instructor.',
    'Collaborate with study group.',
    'Plan next weeks study schedule.',
  ],
  generic: [
    'Define 3 key tasks for today.',
    'Complete at least one deep focus block.',
    'Tidy your workspace for 5 minutes.',
    'Process or clear your inbox once.',
    'Review progress at the end of the day.',
    'Plan a small improvement for tomorrow.',
    'Write down one thing you learned.',
    'End the day with a short reflection.',
  ],
};

router.use(auth);

// GET /api/roadmap/:careerId
router.get('/:careerId', (req, res) => {
  const { careerId } = req.params;
  const steps = ROADMAPS[careerId] || ROADMAPS.generic;
  res.json({ steps });
});

module.exports = router;
module.exports.ROADMAPS = ROADMAPS;
