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
