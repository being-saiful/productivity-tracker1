/* -----------------------------------------------------------------------
   PUBLIC/app.js – Front‑end “thin client” that talks to the REST API
   -----------------------------------------------------------------------*/

const API_BASE = '/api'; // Express serves the same origin

/* -----------------------------------------------------------------------
   Helper: generic API request (adds JWT automatically, parses JSON,
   throws on non‑2xx, returns data.
   -----------------------------------------------------------------------*/
async function api(endpoint, { method = 'GET', body = null } = {}) {
  const token = localStorage.getItem('pt_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const resp = await fetch(`${API_BASE}${endpoint}`, opts);
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || 'API error');
  return data;
}

/* -----------------------------------------------------------------------
   CAREERS AND APPS CONSTANTS
   -----------------------------------------------------------------------*/
const CAREERS = [
  { id: 'programmer', label: 'Programmer', emoji: '💻' },
  { id: 'writer', label: 'Writer', emoji: '✍️' },
  { id: 'designer', label: 'Designer', emoji: '🎨' },
  { id: 'teacher', label: 'Teacher', emoji: '👨‍🏫' },
  { id: 'manager', label: 'Manager', emoji: '👔' },
  { id: 'student', label: 'Student', emoji: '🎓' },
];

const DEFAULT_APPS = [
  'VS Code',
  'Chrome',
  'Slack',
  'Notion',
  'Terminal',
];

const CAREER_APPS = {
  programmer: ['VS Code', 'GitHub', 'Terminal', 'Git', 'Node.js'],
  writer: ['Scrivener', 'Grammarly', 'Notion', 'Google Docs', 'Word'],
  designer: ['Figma', 'Photoshop', 'Adobe XD', 'Sketch', 'Illustrator'],
  teacher: ['Google Classroom', 'Zoom', 'Canvas', 'PowerPoint', 'Notion'],
  manager: ['Jira', 'Asana', 'Slack', 'Teams', 'Notion'],
  student: ['GitHub', 'VS Code', 'Notion', 'Google Docs', 'Zoom'],
};

/**
 * Get currently selected apps from the UI
 */
function getSelectedApps() {
  return Array.from(appsGrid.querySelectorAll('.app-chip.active')).map(
    (c) => c.dataset.app
  );
}

/* -----------------------------------------------------------------------
   UI – same IDs as before, only the data‑source changed.
   -----------------------------------------------------------------------*/
const statusUser = document.getElementById('statusUser');
const logoutBtn = document.getElementById('logoutBtn');
const footerTabs = document.querySelectorAll('.footer-tab');

/* STEP 1 – Sign‑up / quick login ------------------------------------------------ */
const signupName = document.getElementById('signupName');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupError = document.getElementById('signupError');
const step1NextBtn = document.getElementById('step1NextBtn');

const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');

/* STEP 2 – Career -------------------------------------------------------------- */
const careerGrid = document.getElementById('careerGrid');
const careerError = document.getElementById('careerError');
const step2NextBtn = document.getElementById('step2NextBtn');
const step2BackBtn = document.getElementById('step2BackBtn');

/* STEP 3 – Level --------------------------------------------------------------- */
const levelRow = document.getElementById('levelRow');
const levelError = document.getElementById('levelError');
const step3NextBtn = document.getElementById('step3NextBtn');
const step3BackBtn = document.getElementById('step3BackBtn');

/* STEP 4 – Daily time ---------------------------------------------------------- */
const timeRow = document.getElementById('timeRow');
const timeError = document.getElementById('timeError');
const step4NextBtn = document.getElementById('step4NextBtn');
const step4BackBtn = document.getElementById('step4BackBtn');

/* STEP 5 – Apps --------------------------------------------------------------- */
const appsGrid = document.getElementById('appsGrid');
const customAppInput = document.getElementById('customAppInput');
const selectedAppsRow = document.getElementById('selectedAppsRow');
const appsError = document.getElementById('appsError');
const step5NextBtn = document.getElementById('step5NextBtn');
const step5BackBtn = document.getElementById('step5BackBtn');

/* STEP 6 – Roadmap ------------------------------------------------------------ */
const roadmapTitle = document.getElementById('roadmapTitle');
const roadmapCareerBadge = document.getElementById('roadmapCareerBadge');
const roadmapSubtitle = document.getElementById('roadmapSubtitle');
const roadmapSteps = document.getElementById('roadmapSteps');
const step6NextBtn = document.getElementById('step6NextBtn');
const step6BackBtn = document.getElementById('step6BackBtn');

/* STEP 7 – Checklist preview --------------------------------------------------- */
const checklistPreview = document.getElementById('checklistPreview');
const step7NextBtn = document.getElementById('step7NextBtn');
const step7BackBtn = document.getElementById('step7BackBtn');

/* MARK PAGE ------------------------------------------------------------------- */
const todayChecklistSummary = document.getElementById('todayChecklistSummary');
const checklistContainer = document.getElementById('checklistContainer');
const markNextBtn = document.getElementById('markNextBtn');
const markBackBtn = document.getElementById('markBackBtn');

/* DASHBOARD ------------------------------------------------------------------- */
const progressRing = document.getElementById('progressRing');
const productivityPercent = document.getElementById('productivityPercent');
const productivityLabel = document.getElementById('productivityLabel');
const focusedMinutesValue = document.getElementById('focusedMinutesValue');
const tasksCompletedValue = document.getElementById('tasksCompletedValue');
const dashboardCareerBadge = document.getElementById('dashboardCareerBadge');
const streakCount = document.getElementById('streakCount');
const weeklyProgress = document.getElementById('weeklyProgress');
const goalProgress = document.getElementById('goalProgress');
const productivityTrend = document.getElementById('productivityTrend');
const linkDeviceDashboardBtn = document.getElementById('linkDeviceDashboardBtn');

const timerDisplay = document.getElementById('timerDisplay');
const timerStartStopBtn = document.getElementById('timerStartStopBtn');
const timerResetBtn = document.getElementById('timerResetBtn');

const activityList = document.getElementById('activityList');
const insightsText = document.getElementById('insightsText');
const insightsActions = document.getElementById('insightsActions');
const historyDateInput = document.getElementById('historyDate');
const viewHistoryBtn = document.getElementById('viewHistoryBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const historySummary = document.getElementById('historySummary');

/* LINK DEVICE --------------------------------------------------------------- */
const deviceCodeInput = document.getElementById('deviceCodeInput');
const generateCodeBtn = document.getElementById('generateCodeBtn');
const deviceCodeDisplay = document.getElementById('deviceCodeDisplay');
const linkDeviceBtn = document.getElementById('linkDeviceBtn');
const linkDeviceError = document.getElementById('linkDeviceError');
const linkedDevicesList = document.getElementById('linkedDevicesList');
const linkDeviceBackBtn = document.getElementById('linkDeviceBackBtn');

/* GLOBAL STATE --------------------------------------------------------------- */
let currentUser = null; // will be set after login / loadSession()
let timerInterval = null;
let timerSeconds = 0;

/* -----------------------------------------------------------------------
   PAGE NAVIGATION – unchanged, just keeps the UI flow.
   ----------------------------------------------------------------------- */
const PAGES = {
  step1: 'page-step1',
  step2: 'page-step2',
  step3: 'page-step3',
  step4: 'page-step4',
  step5: 'page-step5',
  step6: 'page-step6',
  step7: 'page-step7',
  mark: 'page-mark',
  dashboard: 'page-dashboard',
  linkDevice: 'page-link-device',
};

function setPage(id) {
  document
    .querySelectorAll('.page')
    .forEach((p) => p.classList.toggle('active', p.id === id));

  if (id === PAGES.dashboard) setActiveFooter('dashboard');
  else if (id === PAGES.mark) setActiveFooter('mark');
  else if (id === PAGES.linkDevice) setActiveFooter('dashboard');
  else setActiveFooter('flow');
}
function setActiveFooter(tab) {
  footerTabs.forEach((el) =>
    el.classList.toggle('active', el.dataset.tab === tab)
  );
}

/* -----------------------------------------------------------------------
   USER STATE & UI ----------------------------------------------------------------
   ----------------------------------------------------------------------- */
function setLoggedInUser(user) {
  currentUser = user;
  statusUser.textContent = user ? user.name : 'Guest';
  logoutBtn.style.opacity = user ? '1' : '0.3';
}

/* -----------------------------------------------------------------------
   AUTH – SIGN‑UP AND QUICK LOGIN
   ----------------------------------------------------------------------- */
step1NextBtn.addEventListener('click', async () => {
  const name = signupName.value.trim() || 'User';
  const email = signupEmail.value.trim();
  const password = signupPassword.value.trim();

  signupError.style.display = 'none';
  if (!email || !password) {
    signupError.textContent = 'Email & password required';
    signupError.style.display = 'block';
    return;
  }
  if (password.length < 4) {
    signupError.textContent = 'Password must be ≥ 4 chars';
    signupError.style.display = 'block';
    return;
  }

  try {
    const { token, user } = await api('/auth/signup', {
      method: 'POST',
      body: { name, email, password },
    });
    localStorage.setItem('pt_token', token);
    setLoggedInUser(user);
    initCareersAndSurvey(); // Populate career list
    setPage(PAGES.step2);
  } catch (e) {
    signupError.textContent = e.message;
    signupError.style.display = 'block';
  }
});

loginBtn.addEventListener('click', async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  loginError.style.display = 'none';
  if (!email || !password) {
    loginError.textContent = 'Both fields required';
    loginError.style.display = 'block';
    return;
  }
  try {
    const { token, user } = await api('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    localStorage.setItem('pt_token', token);
    setLoggedInUser(user);
    // Load everything that depends on user → roadmap etc.
    initCareersAndSurvey();
    setPage(PAGES.mark);
    refreshMarkPage();
  } catch (e) {
    loginError.textContent = e.message;
    loginError.style.display = 'block';
  }
});

/* -----------------------------------------------------------------------
   SESSION RESTORE – called on app start
   ----------------------------------------------------------------------- */
async function restoreSession() {
  const token = localStorage.getItem('pt_token');
  if (!token) return false;
  try {
    const { user } = await api('/user/me');
    setLoggedInUser(user);
    return true;
  } catch (_) {
    localStorage.removeItem('pt_token');
    return false;
  }
}

/* -----------------------------------------------------------------------
   FRIENDLY “CAREER” RADIO GRID
   ----------------------------------------------------------------------- */
function initCareersAndSurvey() {
  careerGrid.innerHTML = '';
  CAREERS.forEach((c) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'career-pill';
    btn.dataset.id = c.id;
    btn.innerHTML = `<span>${c.label}</span><span class="emoji">${c.emoji}</span>`;
    btn.addEventListener('click', () => {
      careerGrid.querySelectorAll('.career-pill').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
    careerGrid.appendChild(btn);
  });
  
  // Add event listeners for level chips
  levelRow.querySelectorAll('.app-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      levelRow.querySelectorAll('.app-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // Add event listeners for time chips
  timeRow.querySelectorAll('.app-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      timeRow.querySelectorAll('.app-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

/* -----------------------------------------------------------------------
   STEP 2 – Save career
   ----------------------------------------------------------------------- */
step2NextBtn.addEventListener('click', async () => {
  const active = careerGrid.querySelector('.career-pill.active');
  if (!active) {
    careerError.textContent = 'Pick a career';
    careerError.style.display = 'block';
    return;
  }
  careerError.style.display = 'none';
  const careerId = active.dataset.id;
  await api('/user/career', { method: 'PUT', body: { careerId } });
  // Keep the updated user object in memory
  currentUser.career_id = careerId;
  setPage(PAGES.step3);
});
step2BackBtn.addEventListener('click', () => setPage(PAGES.step1));

/* -----------------------------------------------------------------------
   STEP 3 – Save level (beginner / intermediate / advanced)
   ----------------------------------------------------------------------- */
step3NextBtn.addEventListener('click', async () => {
  const active = levelRow.querySelector('.app-chip.active');
  if (!active) {
    levelError.textContent = 'Pick a level';
    levelError.style.display = 'block';
    return;
  }
  levelError.style.display = 'none';
  const level = active.dataset.level;
  await api('/user/level', { method: 'PUT', body: { level } });
  currentUser.level = level;
  setPage(PAGES.step4);
});
step3BackBtn.addEventListener('click', () => setPage(PAGES.step2));

/* -----------------------------------------------------------------------
   STEP 4 – Save daily time choice
   ----------------------------------------------------------------------- */
step4NextBtn.addEventListener('click', async () => {
  const active = timeRow.querySelector('.app-chip.active');
  if (!active) {
    timeError.textContent = 'Pick a time range';
    timeError.style.display = 'block';
    return;
  }
  timeError.style.display = 'none';
  const minutes = parseInt(active.dataset.time, 10);
  await api('/user/dailyMinutes', { method: 'PUT', body: { minutes } });
  currentUser.daily_minutes = minutes;
  // after we know career & minutes we can populate the default apps list:
  initApps();
  setPage(PAGES.step5);
});
step4BackBtn.addEventListener('click', () => setPage(PAGES.step3));

/* -----------------------------------------------------------------------
   STEP 5 – Preferred tools (default + custom)
   ----------------------------------------------------------------------- */
function createAppChip(name) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'app-chip';
  chip.dataset.app = name;
  chip.innerHTML = `<div class="app-chip-dot"></div><span>${name}</span>`;
  chip.addEventListener('click', () => {
    chip.classList.toggle('active');
    syncSelectedAppsRow();
  });
  return chip;
}
function initApps() {
  appsGrid.innerHTML = '';
  selectedAppsRow.innerHTML = '';

  // determine the default list (career‑specific or generic)
  let defaultApps = DEFAULT_APPS;
  if (currentUser && currentUser.career_id) {
    const careerSpecific = CAREER_APPS[currentUser.career_id];
    if (careerSpecific) defaultApps = careerSpecific;
  }

  defaultApps.forEach((name) => {
    const chip = createAppChip(name);
    chip.classList.add('active');
    appsGrid.appendChild(chip);
  });
  syncSelectedAppsRow();
}
function syncSelectedAppsRow() {
  const selected = Array.from(appsGrid.querySelectorAll('.app-chip.active')).map(
    (c) => c.dataset.app
  );
  selectedAppsRow.innerHTML = '';
  selected.forEach((name) => {
    const div = document.createElement('div');
    div.className = 'tiny-chip';
    div.textContent = name;
    selectedAppsRow.appendChild(div);
  });
}
customAppInput.addEventListener('keyup', (e) => {
  if (e.key !== 'Enter') return;
  const val = customAppInput.value.trim();
  if (!val) return;
  // avoid duplicates
  if (
    Array.from(appsGrid.querySelectorAll('.app-chip')).some(
      (c) => c.dataset.app.toLowerCase() === val.toLowerCase()
    )
  ) {
    customAppInput.value = '';
    return;
  }
  const chip = createAppChip(val);
  chip.classList.add('active');
  appsGrid.appendChild(chip);
  syncSelectedAppsRow();
  customAppInput.value = '';
});
// after the /user/apps endpoint returns, it also sends back:
// { success:true, kept: <int>, dropped: <int> }

step5NextBtn.addEventListener('click', async () => {
  const selected = getSelectedApps();
  if (selected.length === 0) {
    appsError.textContent = 'Select at least one app';
    appsError.style.display = 'block';
    return;
  }
  appsError.style.display = 'none';
  try {
    const resp = await fetch('/api/user/apps', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apps: selected })
    });
    const json = await resp.json();
    // show a tiny info toast
    if (json.dropped > 0) {
      alert(`${json.dropped} non‑productive app(s) were removed by the AI classifier.`);
    }
    currentUser.productiveApps = selected; // refreshed later from GET /me
    buildRoadmapPreview();                // proceeds to step 6
    setPage(PAGES.step6);
  } catch (e) {
    appsError.textContent = 'Failed to save apps – ' + e.message;
    appsError.style.display = 'block';
  }
});

step5BackBtn.addEventListener('click', () => setPage(PAGES.step4));

/* -----------------------------------------------------------------------
   STEP 6 – Roadmap preview (static for now, fetched from API)
   ----------------------------------------------------------------------- */
async function buildRoadmapPreview() {
  if (!currentUser) return;
  const careerId = currentUser.career_id || 'generic';
  const { steps } = await api(`/roadmap/${careerId}`);

  roadmapTitle.textContent = `Habits for ${careerId}`;
  roadmapCareerBadge.textContent = careerId;
  roadmapSubtitle.textContent =
    'These habits come from your survey answers. You will mark them later.';

  // Render roadmap list
  roadmapSteps.innerHTML = '';
  checklistPreview.innerHTML = '';

  steps.forEach((step, idx) => {
    // Roadmap card (the “preview”)
    const row = document.createElement('div');
    row.className = 'activity-item';
    row.innerHTML = `
      <div class="activity-main">
        <div class="activity-title">${step}</div>
        <div class="activity-meta">Habit ${idx + 1}</div>
      </div>
      <div><div class="activity-pill">Daily habit</div></div>
    `;
    roadmapSteps.appendChild(row);

    // Same row for the checklist preview (just change the pill text)
    const preview = row.cloneNode(true);
    preview.querySelector('.activity-pill').textContent = 'Will have a Mark done button';
    checklistPreview.appendChild(preview);
  });
}
step6NextBtn.addEventListener('click', () => setPage(PAGES.step7));
step6BackBtn.addEventListener('click', () => setPage(PAGES.step5));

/* -----------------------------------------------------------------------
   STEP 7 – Checklist preview → Mark page
   ----------------------------------------------------------------------- */
step7NextBtn.addEventListener('click', async () => {
  try {
    await refreshMarkPage(); // pull today's stats from the server
    setPage(PAGES.mark);
  } catch (e) {
    console.error('Error loading mark page:', e);
    alert('Failed to load checklist: ' + e.message);
  }
});
step7BackBtn.addEventListener('click', () => setPage(PAGES.step6));

/* -----------------------------------------------------------------------
   MARK PAGE – toggle checklist items, persist to backend
   ----------------------------------------------------------------------- */
async function refreshMarkPage() {
  if (!currentUser) return;
  
  try {
    const data = await api('/stats/today');
    const stats = data.stats || data;
    const activityLogs = data.activityLogs || [];

    // Store the stats in memory for quick UI refs
    currentUser.todayStats = stats;

    // Render checklist
    checklistContainer.innerHTML = '';
    const steps = await api(`/roadmap/${currentUser.career_id || 'generic'}`);
    const total = steps.steps.length;

    // we keep a list of completed IDs inside `stats.completed_task_ids` (JSON array)
    let completed = [];
    if (stats && stats.completed_task_ids) {
      try {
        completed = JSON.parse(stats.completed_task_ids);
      } catch (e) {
        console.error('Failed to parse completed_task_ids:', e);
        completed = [];
      }
    }

    steps.steps.forEach((title, i) => {
      const row = document.createElement('div');
      row.className = 'activity-item';

      const left = document.createElement('div');
      left.className = 'activity-main';
      left.innerHTML = `
        <div class="activity-title">${title}</div>
        <div class="activity-meta">Habit ${i + 1}</div>
      `;

      const right = document.createElement('div');
      const btn = document.createElement('button');
      btn.className = 'check-toggle';
      const stepId = `step-${i}`;
      const done = completed.includes(stepId);
      btn.textContent = done ? 'Done ✓' : 'Mark done';
      if (done) btn.classList.add('done');

      btn.addEventListener('click', async () => {
        await api('/stats/today', {
          method: 'PATCH',
          body: { action: 'completeTask', index: i },
        });
        refreshMarkPage(); // re-fetch & re‑render
      });
      right.appendChild(btn);
      row.appendChild(left);
      row.appendChild(right);
      checklistContainer.appendChild(row);
    });

    // Summary chips
    todayChecklistSummary.innerHTML = '';
    const doneChip = document.createElement('div');
    doneChip.className = 'tag-pill';
    doneChip.innerHTML = `<div class="tag-pill-dot" style="background:#22c55e"></div>Done: ${stats.tasks_completed || 0}/${total}`;
    const focusChip = document.createElement('div');
    focusChip.className = 'tag-pill';
    focusChip.innerHTML = `<div class="tag-pill-dot" style="background:#38bdf8"></div>${stats.focused_minutes || 0} min focus`;
    todayChecklistSummary.appendChild(doneChip);
    todayChecklistSummary.appendChild(focusChip);
  } catch (e) {
    console.error('Error in refreshMarkPage:', e);
    checklistContainer.innerHTML = `<div style="color: red;">Error loading checklist: ${e.message}</div>`;
  }
}

/* -----------------------------------------------------------------------
   MARK → DASHBOARD
   ----------------------------------------------------------------------- */
markNextBtn.addEventListener('click', async () => {
  try {
    await loadDashboard(); // pulls latest stats from the server
    setPage(PAGES.dashboard);
  } catch (e) {
    console.error('Error loading dashboard:', e);
    alert('Failed to load dashboard: ' + e.message);
  }
});
markBackBtn.addEventListener('click', () => setPage(PAGES.step7));

/* -----------------------------------------------------------------------
   DASHBOARD – all visualisation functions rely on the fresh stats
   ----------------------------------------------------------------------- */
async function loadDashboard() {
  if (!currentUser) return;
  
  try {
    const data = await api('/stats/today');
    const stats = data.stats || data;
    currentUser.todayStats = stats;

    // Prefer backend's combined productivity if available
    let percent = null;
    if (typeof data.productivityPercent === 'number') {
      percent = data.productivityPercent;
    } else {
      percent = computeProductivityPercent(stats);
    }

    productivityPercent.textContent = `${percent}%`;
    productivityLabel.textContent = data.productivityPercent ? getProductivityLabel(data.productivityPercent) : getProductivityLabel(percent);
    progressRing.style.setProperty('--p', `${percent}%`);

    // ---- Numbers -----------------------------------------------------------
    focusedMinutesValue.textContent = `${stats.focused_minutes || 0} min`;
    tasksCompletedValue.textContent = `${stats.tasks_completed || 0} / ${stats.total_tasks || 0}`;

    // ---- Career badge ------------------------------------------------------
    dashboardCareerBadge.textContent = currentUser.career_id || 'Generic';

    // ---- Streak, weekly averages, goal progress -----------------------------
    updateStreakCounter();
    updateWeeklyProgress();
    updateGoalProgress();

    // ---- Recent activity list ------------------------------------------------
    const logs = data.activityLogs || [];

    activityList.innerHTML = '';
    if (logs.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'no-activities';
      empty.textContent =
        'No activity logged yet. Use the Mark page or timer to build your day.';
      activityList.appendChild(empty);
    } else {
      logs
        .slice()
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 12)
        .forEach((log) => {
          const item = document.createElement('div');
          item.className = 'activity-item';
          const left = document.createElement('div');
          left.className = 'activity-main';
          left.innerHTML = `
            <div class="activity-title">${log.title}</div>
            <div class="activity-meta">${log.detail} • ${new Date(
            log.timestamp
          )
            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          `;
          const right = document.createElement('div');
          const pill = document.createElement('div');
          pill.className = 'activity-pill';
          pill.textContent = log.type === 'timer' ? 'Focus' : 'Checklist';
          right.appendChild(pill);
          item.appendChild(left);
          item.appendChild(right);
          activityList.appendChild(item);
        });
    }

    // ---- Insights -----------------------------------------------------------
    updateInsights(stats);

    // ---- App usage list -----------------------------------------------------
    const apps = data.appUsage || [];
    const appUsageEl = document.getElementById('appUsageList');
    appUsageEl.innerHTML = '';
    if (!apps || apps.length === 0) {
      appUsageEl.innerHTML = '<div class="no-activities">No app usage data yet</div>';
    } else {
      apps.forEach((a) => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        const left = document.createElement('div');
        left.className = 'activity-main';
        left.innerHTML = `
          <div class="activity-title">${a.app_name}</div>
          <div class="activity-meta">${a.category || 'General'} • ${a.minutes_used} min</div>
        `;
        const right = document.createElement('div');
        const pill = document.createElement('div');
        pill.className = 'activity-pill';
        pill.textContent = a.is_productive ? 'Productive' : (a.is_productive === false ? 'Unproductive' : 'Unknown');
        pill.style.background = a.is_productive ? '#22c55e' : (a.is_productive === false ? '#ef4444' : '#94a3b8');
        right.appendChild(pill);
        item.appendChild(left);
        item.appendChild(right);
        appUsageEl.appendChild(item);
      });
    }
  } catch (e) {
    console.error('Error in loadDashboard:', e);
    activityList.innerHTML = `<div style="color: red;">Error loading dashboard: ${e.message}</div>`;
  }
}

/* -----------------------------------------------------------------------
   PRODUCTIVITY CALCULATIONS (same math as before)
   ----------------------------------------------------------------------- */
function computeProductivityPercent(stats) {
  // If no tasks are defined yet, show 0
  if (!stats.total_tasks || stats.total_tasks === 0) return 0;
  
  // Calculate based on checklist completion and focus time
  const checklistScore = (stats.tasks_completed || 0) / stats.total_tasks;
  const focusScore = Math.min((stats.focused_minutes || 0) / 60, 1);
  const combined = checklistScore * 0.7 + focusScore * 0.3;
  return Math.min(100, Math.max(0, Math.round(combined * 100)));
}
function getProductivityLabel(percent) {
  if (percent >= 80) return 'On fire! 🔥';
  if (percent >= 60) return 'Strong progress 💪';
  if (percent >= 40) return 'Warming up ✨';
  if (percent >= 20) return 'Building momentum 🌱';
  return 'Booting up 🚀';
}

/* -----------------------------------------------------------------------
   INSIGHTS UI (unchanged, just uses the new stats)
   ----------------------------------------------------------------------- */
function updateInsights(stats) {
  const percent = computeProductivityPercent(stats);
  if (percent < 30) {
    insightsText.textContent =
      'Score is low now. Finish one habit and run a short focus timer.';
  } else if (percent < 60) {
    insightsText.textContent =
      'Nice progress. A couple more habits will push you higher.';
  } else {
    insightsText.textContent = 'Great day. Protect your focus and write a quick reflection.';
  }

  // action pills
  insightsActions.innerHTML = '';
  const ideas = [];
  if (stats.tasks_completed === 0) ideas.push('Start with the smallest habit first.');
  else if (stats.tasks_completed < stats.total_tasks) ideas.push('Finish one remaining habit right now.');
  else ideas.push('Plan tomorrow’s first habit in advance.');

  if (stats.focused_minutes < 25) ideas.push('Reach at least 25 minutes of pure focus.');
  else ideas.push('Try another short focus block if energy allows.');

  ideas.forEach((i) => {
    const pill = document.createElement('div');
    pill.className = 'insights-action-pill';
    pill.textContent = i;
    insightsActions.appendChild(pill);
  });
}

/* -----------------------------------------------------------------------
   STREAK / WEEKLY / GOAL helpers (simplified – using today's stats only)
   ----------------------------------------------------------------------- */
async function updateStreakCounter() {
  if (!currentUser) {
    streakCount.textContent = '0 days';
    return;
  }
  // For now, show a placeholder. Real implementation would need history endpoint
  streakCount.textContent = '1 day';
}

async function updateWeeklyProgress() {
  if (!currentUser) {
    weeklyProgress.textContent = '0%';
    return;
  }
  try {
    // For now, show today's productivity as weekly estimate
    const data = await api('/stats/today');
    const stats = data.stats || data;
    const pct = computeProductivityPercent(stats);
    weeklyProgress.textContent = `${pct}%`;
  } catch (e) {
    console.error('Error in updateWeeklyProgress:', e);
    weeklyProgress.textContent = '0%';
  }
}

async function updateGoalProgress() {
  if (!currentUser) {
    goalProgress.textContent = '0/7 days';
    return;
  }
  try {
    // For now, show today's stats as part of weekly goal
    const data = await api('/stats/today');
    const stats = data.stats || data;
    const pct = computeProductivityPercent(stats);
    const okDays = pct >= 70 ? 1 : 0;
    goalProgress.textContent = `${okDays}/7 days`;
  } catch (e) {
    console.error('Error in updateGoalProgress:', e);
    goalProgress.textContent = '0/7 days';
  }
}

/* -----------------------------------------------------------------------
   TIMER – now logs to the server on reset
   ----------------------------------------------------------------------- */
function formatTimer(sec) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timerSeconds += 1;
    timerDisplay.textContent = formatTimer(timerSeconds);
  }, 1000);
  timerStartStopBtn.textContent = '⏸ Pause';
}
function pauseTimer() {
  if (!timerInterval) return;
  clearInterval(timerInterval);
  timerInterval = null;
  timerStartStopBtn.textContent = '▶ Start';
}
async function resetTimerAndLog() {
  if (timerSeconds > 0 && currentUser) {
    const minutes = Math.max(1, Math.round(timerSeconds / 60));
    await api('/stats/today', {
      method: 'PATCH',
      body: { action: 'addFocus', minutes },
    });
    // Refresh the dashboard numbers
    await loadDashboard();
  }
  timerSeconds = 0;
  timerDisplay.textContent = '00:00';
  timerStartStopBtn.textContent = '▶ Start';
}
timerStartStopBtn.addEventListener('click', () => {
  if (!currentUser) {
    alert('You need to be logged in before using the timer.');
    return;
  }
  timerInterval ? pauseTimer() : startTimer();
});
timerResetBtn.addEventListener('click', resetTimerAndLog);

/* -----------------------------------------------------------------------
   HISTORY VIEW -------------------------------------------------------------
   ----------------------------------------------------------------------- */
viewHistoryBtn.addEventListener('click', async () => {
  const day = historyDateInput.value;
  if (!day) {
    historySummary.textContent = 'Pick a date first';
    return;
  }
  const { stats, activityLogs } = await api(`/stats/history?date=${day}`);
  if (!stats) {
    historySummary.textContent = `No data for ${day}`;
    return;
  }
  const pct = computeProductivityPercent(stats);
  const txt = `Date: ${day} • Score: ${pct}% • Habits: ${stats.tasks_completed}/${stats.total_tasks} • Focus: ${stats.focused_minutes} min`;
  historySummary.textContent = txt;
});

/* -----------------------------------------------------------------------
   PDF EXPORT – uses jsPDF (bundled via CDN)
   ----------------------------------------------------------------------- */
exportPdfBtn.addEventListener('click', async () => {
  if (!currentUser) {
    alert('Log in to export.');
    return;
  }
  const { stats, activityLogs } = await api('/stats/today');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Productivity Report', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`User: ${currentUser.name}`, 20, 30);
  doc.text(`Date: ${stats.date}`, 20, 38);
  doc.text(`Score: ${computeProductivityPercent(stats)}%`, 20, 46);
  doc.text(`Habits done: ${stats.tasks_completed}/${stats.total_tasks}`, 20, 54);
  doc.text(`Focus minutes: ${stats.focused_minutes}`, 20, 62);

  doc.text('Recent activities', 20, 75);
  const startY = 82;
  let y = startY;
  activityLogs.slice(0, 10).forEach((log) => {
    const time = new Date(log.timestamp)
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const line = `- ${log.title}: ${log.detail} (${time})`;
    doc.text(line, 20, y);
    y += 6;
  });

  doc.save(`productivity-${stats.date}.pdf`);
});

/* -----------------------------------------------------------------------
   DEVICE LINKING – uses the new API endpoints
   ----------------------------------------------------------------------- */
generateCodeBtn.addEventListener('click', async () => {
  const { code } = await api('/devices/generateCode', { method: 'POST' });
  deviceCodeDisplay.textContent = code;
});
linkDeviceBtn.addEventListener('click', async () => {
  const code = deviceCodeInput.value.trim().toUpperCase();
  const name = `Web ${navigator.userAgent.slice(0, 30)}`;
  linkDeviceError.style.display = 'none';
  if (!code) {
    linkDeviceError.textContent = 'Enter a code';
    linkDeviceError.style.display = 'block';
    return;
  }
  try {
    const { device } = await api('/devices/link', {
      method: 'POST',
      body: { code, name },
    });
    // refresh linked device list UI
    loadLinkedDevices();
    deviceCodeInput.value = '';
    linkDeviceError.textContent = 'Device linked!';
    linkDeviceError.style.color = '#22c55e';
    linkDeviceError.style.display = 'block';
    setTimeout(() => (linkDeviceError.style.display = 'none'), 2500);
  } catch (e) {
    linkDeviceError.textContent = e.message;
    linkDeviceError.style.display = 'block';
  }
});

async function loadLinkedDevices() {
  const { devices } = await api('/devices');
  if (!devices || devices.length === 0) {
    linkedDevicesList.innerHTML =
      '<div class="no-activities">No devices linked yet</div>';
    return;
  }
  linkedDevicesList.innerHTML = '';
  devices.forEach((dev) => {
    const el = document.createElement('div');
    el.className = 'activity-item';
    const date = new Date(dev.linked_at).toLocaleDateString();
    el.innerHTML = `
      <div class="activity-main">
        <div class="activity-title">${dev.name}</div>
        <div class="activity-meta">Linked: ${date}</div>
      </div>
      <div class="activity-pill">Active</div>
    `;
    linkedDevicesList.appendChild(el);
  });
}
linkDeviceDashboardBtn.addEventListener('click', async () => {
  setPage(PAGES.linkDevice);
  await loadLinkedDevices();
});
linkDeviceBackBtn.addEventListener('click', () => setPage(PAGES.dashboard));

/* -----------------------------------------------------------------------
   LOGOUT
   ----------------------------------------------------------------------- */
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('pt_token');
  currentUser = null;
  setPage(PAGES.step1);
});

/* -----------------------------------------------------------------------
   FOOTER navigation (kept identical, just changed page IDs)
   ----------------------------------------------------------------------- */
footerTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const dest = tab.dataset.tab;
    if (dest === 'dashboard') setPage(PAGES.dashboard);
    else if (dest === 'mark') setPage(PAGES.mark);
    else {
      // "flow" – go to the first unfinished step
      if (!currentUser) setPage(PAGES.step1);
      else if (!currentUser.career_id) setPage(PAGES.step2);
      else if (!currentUser.level) setPage(PAGES.step3);
      else if (!currentUser.daily_minutes) setPage(PAGES.step4);
      else setPage(PAGES.step6);
    }
  });
});

/* -----------------------------------------------------------------------
   APP START – try to restore session, otherwise show step‑1
   ----------------------------------------------------------------------- */
(async function initApp() {
  const ok = await restoreSession();
  if (ok) {
    initCareersAndSurvey(); // populate UI
    setPage(PAGES.mark);
    await refreshMarkPage();
    // also preload dashboard so the first switch is instant
    await loadDashboard();
  } else {
    setPage(PAGES.step1);
  }
})();
