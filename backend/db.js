// backend/db.js
const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: process.env.DB_PATH || './data/pt.sqlite3',
  },
  useNullAsDefault: true,
});

module.exports = db;

// backend/migrations/20231207_create_users.js
exports.up = function (knex) {
  return knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.string('career_id');   // foreign key to static careers list
    t.string('level');        // beginner | intermediate | advanced
    t.integer('daily_minutes'); // 15,30,60 …
    t.timestamps(true, true);
  });
};

exports.down = (knex) => knex.schema.dropTable('users');

// backend/migrations/20231207_create_user_apps.js
exports.up = (knex) =>
  knex.schema.createTable('user_apps', (t) => {
    t.increments('id').primary();
    t.integer('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.string('app_name').notNullable();
    t.unique(['user_id', 'app_name']);
  });

exports.down = (knex) => knex.schema.dropTable('user_apps');
// backend/migrations/20231207_create_stats.js
exports.up = (knex) =>
  knex.schema.createTable('stats', (t) => {
    t.increments('id').primary();
    t.integer('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.date('date').notNullable();               // YYYY‑MM‑DD
    t.integer('focused_minutes').defaultTo(0);
    t.integer('tasks_completed').defaultTo(0);
    t.integer('total_tasks').defaultTo(0);
    t.unique(['user_id', 'date']);
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTable('stats');
// backend/migrations/20231207_create_activity_logs.js
exports.up = (knex) =>
  knex.schema.createTable('activity_logs', (t) => {
    t.increments('id').primary();
    t.integer('stats_id')
      .references('id')
      .inTable('stats')
      .onDelete('CASCADE');
    t.string('type').notNullable(); // 'timer' | 'checklist'
    t.string('title').notNullable();
    t.text('detail').notNullable();
    t.integer('minutes').defaultTo(0);
    t.bigInteger('timestamp').notNullable(); // epoch ms
  });

exports.down = (knex) => knex.schema.dropTable('activity_logs');
// backend/migrations/20231207_create_device_codes.js
exports.up = (knex) =>
  knex.schema.createTable('device_codes', (t) => {
    t.increments('id').primary();
    t.string('code', 6).notNullable().unique();
    t.integer('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('expires_at').notNullable();
    t.boolean('used').defaultTo(false);
  });

exports.down = (knex) => knex.schema.dropTable('device_codes');
// backend/migrations/20231207_create_devices.js
exports.up = (knex) =>
  knex.schema.createTable('devices', (t) => {
    t.increments('id').primary();
    t.integer('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.string('name').notNullable();
    t.timestamp('linked_at').defaultTo(knex.fn.now());
    t.timestamp('last_sync').defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema.dropTable('devices');
