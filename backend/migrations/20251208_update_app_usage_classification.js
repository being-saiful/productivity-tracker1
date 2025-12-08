exports.up = function(knex) {
  return knex.schema.table('app_usage', function(t) {
    t.integer('classification_attempts').defaultTo(0);
    t.timestamp('next_retry_at').nullable();
    t.text('last_classification_error').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('app_usage', function(t) {
    t.dropColumn('classification_attempts');
    t.dropColumn('next_retry_at');
    t.dropColumn('last_classification_error');
  });
};
