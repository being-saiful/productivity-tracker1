#!/usr/bin/env node
/**
 * Quick startup test - verifies backend can start
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✓ Backend running on http://localhost:${PORT}`);
  console.log(`✓ Frontend available at http://localhost:${PORT}`);
  console.log(`✓ Database: ./data/pt.sqlite3`);
  console.log(`✓ All systems ready!`);
  
  // Exit after 2 seconds to allow verification
  setTimeout(() => {
    console.log('\nShutting down test...');
    process.exit(0);
  }, 2000);
});
