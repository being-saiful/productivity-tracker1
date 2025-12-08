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
