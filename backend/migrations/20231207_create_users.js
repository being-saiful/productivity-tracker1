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
