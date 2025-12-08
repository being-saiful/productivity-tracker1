exports.up = (knex) =>
  knex.schema.createTable('devices', (t) => {
    t.increments('id').primary();
    t.integer('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.string('name').notNullable();
    t.timestamp('linked_at').defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema.dropTable('devices');
