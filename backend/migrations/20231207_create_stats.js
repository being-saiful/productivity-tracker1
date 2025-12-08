exports.up = (knex) =>
  knex.schema.createTable('stats', (t) => {
    t.increments('id').primary();
    t.integer('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.date('date').notNullable();               // YYYY-MM-DD
    t.integer('focused_minutes').defaultTo(0);
    t.integer('tasks_completed').defaultTo(0);
    t.integer('total_tasks').defaultTo(0);
    t.string('completed_task_ids').defaultTo('[]'); // JSON array as string
    t.unique(['user_id', 'date']);
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTable('stats');
