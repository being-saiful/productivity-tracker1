// backend/utils/ml.js
const axios = require('axios');
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Ask the app-productivity classifier if a given app is productive.
 * Returns {is_productive: boolean, confidence: number}
 */
async function classifyApp(appName, category, career) {
  try {
    const { data } = await axios.post(`${ML_SERVICE_URL}/classify/app`, {
      app_name: appName,
      category,
      career,
    });
    return data;                     // {is_productive, confidence, label}
  } catch (e) {
    console.error('App classifier error ->', e.message);
    // Fallback - assume productive to keep the flow working
    return { is_productive: true, confidence: 0 };
  }
}

/**
 * Ask the roadmap generator for a list of steps.
 * Returns an array of strings.
 */
async function generateRoadmap(career, level = null) {
  try {
    const { data } = await axios.post(`${ML_SERVICE_URL}/generate/roadmap`, {
      career,
      level,
    });
    return data.steps;               // array of steps
  } catch (e) {
    console.error('Roadmap generator error ->', e.message);
    return null;                     // caller will fallback to static list
  }
}

module.exports = { classifyApp, generateRoadmap };
