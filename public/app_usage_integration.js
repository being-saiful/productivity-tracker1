/* global data, api */
/* exported logAppUsage, classifyAppProductivity, computeProductivityPercentV2 */
/* eslint-disable no-unused-vars */
// ==============================================================================
// DASHBOARD WITH APP USAGE TRACKING - PUBLIC/APP.JS EXTENSION
// ==============================================================================
// This code adds app usage tracking visualization to the dashboard
// Add this to your existing app.js loadDashboard() function

// INSERT THIS AFTER THE ACTIVITY LIST SECTION IN loadDashboard():

    // ---- APP USAGE TRACKING (NEW) -----------------------------------------
    const appUsageData = data.appUsage || [];
    const appUsageProductivityPercent = data.appUsageProductivityPercent || 0;

    // Find app usage section in HTML (id="appUsageList")
    const appUsageList = document.getElementById('appUsageList');
    if (appUsageList) {
      appUsageList.innerHTML = '';
      
      if (appUsageData.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'no-activities';
        empty.textContent = 'No app usage tracked yet. Start tracking to see insights.';
        appUsageList.appendChild(empty);
      } else {
        // Show app usage breakdown
        const totalMinutes = appUsageData.reduce((sum, app) => sum + app.minutes_used, 0);
        
        appUsageData.forEach((app) => {
          const item = document.createElement('div');
          item.className = 'activity-item';
          
          const left = document.createElement('div');
          left.className = 'activity-main';
          const percent = totalMinutes > 0 ? Math.round((app.minutes_used / totalMinutes) * 100) : 0;
          const productiveStatus = app.is_productive === true ? '✓ Productive' : app.is_productive === false ? '✗ Unproductive' : '? Unclassified';
          left.innerHTML = `
            <div class="activity-title">${app.app_name}</div>
            <div class="activity-meta">${app.minutes_used} min (${percent}%) • ${productiveStatus}</div>
          `;
          
          const right = document.createElement('div');
          const pill = document.createElement('div');
          pill.className = 'activity-pill';
          
          if (app.is_productive === true) {
            pill.style.backgroundColor = '#22c55e'; // Green
            pill.textContent = 'Productive';
          } else if (app.is_productive === false) {
            pill.style.backgroundColor = '#ef4444'; // Red
            pill.textContent = 'Break';
          } else {
            pill.style.backgroundColor = '#9ca3af'; // Gray
            pill.textContent = 'New';
          }
          
          right.appendChild(pill);
          item.appendChild(left);
          item.appendChild(right);
          appUsageList.appendChild(item);
        });
      }
      
      // Show overall app usage productivity score
      const appProductivityScore = document.getElementById('appProductivityScore');
      if (appProductivityScore) {
        appProductivityScore.textContent = `App Usage Productivity: ${appUsageProductivityPercent}%`;
      }
    }

// ==============================================================================
// HELPER: Log app usage to backend
// ==============================================================================
// Call this function whenever you want to track app usage
async function logAppUsage(appName, minutesUsed, category = 'Unknown') {
  try {
    const response = await api('/app_usage/log', {
      method: 'POST',
      body: { app_name: appName, minutes_used: minutesUsed, category },
    });
    
    console.log(`✓ Logged ${minutesUsed} minutes for ${appName}`);
    
    // Optionally classify the app for productivity scoring
    await classifyAppProductivity(appName, category);
    
    return response;
  } catch (e) {
    console.error(`Error logging app usage for ${appName}:`, e);
  }
}

// ==============================================================================
// HELPER: Classify app as productive/unproductive
// ==============================================================================
async function classifyAppProductivity(appName, category = 'Unknown') {
  try {
    const response = await api('/app_usage/classify', {
      method: 'POST',
      body: { app_name: appName, category },
    });
    
    console.log(`Classification for ${appName}:`, response);
    return response;
  } catch (e) {
    console.error(`Error classifying app ${appName}:`, e);
  }
}

// ==============================================================================
// EXAMPLE: How to use app tracking in your application
// ==============================================================================
/*
// When user switches app (you'd need a way to detect this):
await logAppUsage('VS Code', 45, 'Development');
await logAppUsage('Chrome', 20, 'Web Browsing');

// Or periodic logging (e.g., every 5 minutes):
setInterval(async () => {
  // Pseudo-code: get active app name somehow
  const activeApp = getActiveApplicationName(); // You need to implement this
  if (activeApp) {
    await logAppUsage(activeApp, 5); // Log 5 minutes
  }
}, 5 * 60 * 1000); // Every 5 minutes
*/

// ==============================================================================
// EXTENDED PRODUCTIVITY CALCULATION WITH APP USAGE
// ==============================================================================
// Replace the existing computeProductivityPercent function with this:

function computeProductivityPercentV2(stats, appUsageProductivityPercent = 0) {
  // If no tasks are defined yet, use app usage as fallback
  if (!stats.total_tasks || stats.total_tasks === 0) {
    return appUsageProductivityPercent;
  }
  
  // Calculate based on checklist completion (70%) and focus time (30%)
  const checklistScore = (stats.tasks_completed || 0) / stats.total_tasks;
  const focusScore = Math.min((stats.focused_minutes || 0) / 60, 1);
  const checklistAndFocusScore = checklistScore * 0.7 + focusScore * 0.3;
  
  // If app usage data is available, blend it in (20% weight for app usage)
  if (appUsageProductivityPercent > 0) {
    const finalScore = checklistAndFocusScore * 0.8 + (appUsageProductivityPercent / 100) * 0.2;
    return Math.min(100, Math.max(0, Math.round(finalScore * 100)));
  }
  
  return Math.min(100, Math.max(0, Math.round(checklistAndFocusScore * 100)));
}
