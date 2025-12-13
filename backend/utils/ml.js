const axios = require('axios');

if (!process.env.ML_SERVICE_URL) {
  console.warn(
    '⚠️ ML_SERVICE_URL is not set. Backend will fail to classify apps.'
  );
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

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
    return data;
  } catch (e) {
    console.error('App classifier error ->', e.message);
    return { is_productive: true, confidence: 0 };
  }
}

/**
 * Ask the roadmap generator for a list of steps.
 */
async function generateRoadmap(career, level = null) {
  try {
    const { data } = await axios.post(`${ML_SERVICE_URL}/generate/roadmap`, {
      career,
      level,
    });
    return data.steps;
  } catch (e) {
    console.error('Roadmap generator error ->', e.message);
    return null;
  }
}

module.exports = { classifyApp, generateRoadmap };
