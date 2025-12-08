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
