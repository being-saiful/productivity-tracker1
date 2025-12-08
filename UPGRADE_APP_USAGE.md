# PRODUCTIVITY TRACKER - APP USAGE & ML INTEGRATION UPGRADE

## Overview
This upgrade adds app usage tracking with ML-powered productivity classification to your productivity tracker. The system now tracks which apps you use and classifies them as productive or unproductive using machine learning models trained on your career path.

## What's New

### 1. **App Usage Tracking**
   - Track time spent on different applications
   - Automatic ML-based classification (productive vs unproductive)
   - Daily and weekly app usage analytics
   - New database table: `app_usage`

### 2. **Enhanced ML Service** (`public/main.py`)
   - Fixed imports and error handling
   - Three ML models working together:
     - **App Classifier**: Classifies apps by name and category
     - **YouTube Classifier**: Analyzes video content for productivity
     - **Roadmap Generator**: Creates career-specific learning paths

### 3. **Updated Backend Routes**
   - New `/api/app_usage` endpoints for tracking and analytics
   - Enhanced `/api/stats` endpoints with app usage insights
   - All routes fully integrated with authentication

### 4. **Enhanced Dashboard**
   - App usage breakdown with percentage of time per app
   - Visual indicators for productive vs unproductive apps
   - Combined productivity score (checklist + focus time + app usage)

## Installation Steps

### Step 1: Update Files

Replace the following files with their updated versions:
```bash
# Backend files
cp backend/index_updated.js backend/index.js
cp backend/routes/stats_updated.js backend/routes/stats.js

# Frontend files  
cp public/main_fixed.py public/main.py
cp public/app_usage_integration.js public/app_usage_integration.js (reference only)

# Database migration (should already exist)
# backend/migrations/20231207_create_app_usage.js
# backend/routes/app_usage.js
```

### Step 2: Run Database Migration

```bash
# Kill running servers first
taskkill /F /IM node.exe

# Run migrations
npx knex migrate:latest --knexfile knexfile.js

# Verify migration
npx knex migrate:status --knexfile knexfile.js
```

### Step 3: Restart Backend

```bash
npm start
```

The server should start without errors. You'll see:
```
🚀 API listening on http://localhost:3000
```

### Step 4: (Optional) Start ML Service

In a new terminal:
```bash
.venv\Scripts\python public\main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## How to Use

### Logging App Usage from Frontend

```javascript
// Log app usage - call this when user uses an app
await logAppUsage('VS Code', 45, 'Development');

// Classify app automatically
await classifyAppProductivity('VS Code', 'Development');
```

### Logging App Usage Programmatically

```javascript
// In your app, track app switches:
document.addEventListener('focus', async () => {
  // Get active app name (requires desktop integration)
  const activeApp = await getActiveApp();
  await logAppUsage(activeApp, 5, 'User Activity');
});
```

### API Endpoints

#### Log App Usage
```
POST /api/app_usage/log
Body: { app_name: string, minutes_used: number, category?: string }
Response: { success: true, message: string }
```

#### Classify App
```
POST /api/app_usage/classify
Body: { app_name: string, category?: string }
Response: { app_name, is_productive, confidence, category }
```

#### Get Today's App Usage
```
GET /api/app_usage/today
Response: {
  date: "2025-12-08",
  total_minutes: 480,
  productive_minutes: 360,
  productivity_percent: 75,
  apps: [
    { app_name, minutes_used, is_productive, productivity_score, percent_of_day },
    ...
  ]
}
```

#### Get Weekly App Usage
```
GET /api/app_usage/weekly
Response: {
  period: "2025-12-01 to 2025-12-08",
  total_minutes: 3360,
  productive_minutes: 2520,
  weekly_productivity_percent: 75,
  apps: [...]
}
```

## Productivity Score Calculation

The new system calculates productivity from three sources:

```
Final Score = (Checklist × 0.7 + Focus Time × 0.3) × 0.8 + App Usage × 0.2

Where:
- Checklist Score = completed_tasks / total_tasks
- Focus Time Score = focused_minutes / 60 (capped at 1.0)
- App Usage Score = productive_minutes / total_minutes
```

**Score Tiers:**
- 🚀 Booting up: 0-20%
- 🌱 Building momentum: 20-40%
- ✨ Warming up: 40-60%
- 💪 Strong progress: 60-80%
- 🔥 On fire!: 80-100%

## Database Schema

### `app_usage` Table
```sql
CREATE TABLE app_usage (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date DATE NOT NULL,
  app_name TEXT NOT NULL,
  minutes_used INTEGER DEFAULT 0,
  is_productive BOOLEAN,
  productivity_score FLOAT DEFAULT 0,
  category TEXT,
  last_updated TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, date, app_name),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Troubleshooting

### Database Migration Failed
```bash
# Check migration status
npx knex migrate:status --knexfile knexfile.js

# Rollback last migration
npx knex migrate:rollback --knexfile knexfile.js

# Try again
npx knex migrate:latest --knexfile knexfile.js
```

### ML Service Not Responding
```bash
# Check if service is running
curl http://localhost:8000/health

# Restart the service
.venv\Scripts\python public\main.py
```

### App Usage Not Showing in Dashboard
1. Check browser console for errors (F12)
2. Verify app_usage table has data: `SELECT * FROM app_usage;`
3. Restart backend and refresh page

## Integration with Your App

To automatically track app usage, you need to:

1. **Detect active app** - Use a library or API to get the active window
   - Desktop app: Use Electron/Tauri
   - Browser: Use Page Visibility API

2. **Send tracking data** - Call `logAppUsage()` periodically
   - Every 5 minutes
   - On app switch
   - On page focus

3. **Display results** - Dashboard automatically shows:
   - App breakdown pie chart
   - Productive vs unproductive split
   - Daily/weekly productivity trends

## Example Implementation

```javascript
// Track active tab in browser (web-based)
setInterval(async () => {
  if (document.hidden) return; // Tab is not active
  
  // Get current website/app
  const appName = window.location.hostname || 'Web Browser';
  
  // Log activity
  await logAppUsage(appName, 5, 'Web Browsing');
}, 5 * 60 * 1000); // Every 5 minutes
```

## Next Steps

1. ✅ Install the upgrade
2. ✅ Test the system with your account
3. ⚪ Integrate app tracking into your app
4. ⚪ Train models on your own data (optional)
5. ⚪ Monitor productivity trends over time

## Support

For issues or questions:
1. Check logs: `npm start` output
2. Review database: `SELECT * FROM app_usage;`
3. Test endpoints: `curl http://localhost:3000/api/health`
4. Check browser console: F12 → Console tab

---

**Last Updated:** December 8, 2025
**Version:** 2.0 - App Usage & ML Integration
