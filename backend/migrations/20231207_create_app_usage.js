// backend/migrations/20231207_create_app_usage.js
// Tracks which apps users spend time on and classifies them as productive/unproductive

exports.up = (knex) =>
  knex.schema.createTable('app_usage', (t) => {
    t.increments('id').primary();
    t.integer('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();
    t.date('date').notNullable();                      // YYYY-MM-DD
    t.string('app_name').notNullable();                // e.g., "VS Code", "Chrome"
    t.integer('minutes_used').defaultTo(0);            // Total time on app for this day
    t.boolean('is_productive').nullable();             // true/false, null = not classified yet
    t.float('productivity_score').defaultTo(0);        // 0.0 to 1.0
    t.string('category').nullable();                   // e.g., "Development", "Social", "Entertainment"
    t.timestamp('last_updated').defaultTo(knex.fn.now());
    t.unique(['user_id', 'date', 'app_name']);
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTable('app_usage');
