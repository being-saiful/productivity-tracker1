require('dotenv').config();

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DB_PATH || './data/pt.sqlite3',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './backend/migrations',
    },
  },
  production: {
    // Use Postgres in production (Railway provides DATABASE_URL)
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    },
    pool: { min: 2, max: 10 },
    migrations: {
      directory: './backend/migrations',
    },
  },
};
