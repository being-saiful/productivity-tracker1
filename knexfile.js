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
    client: 'sqlite3',
    connection: {
      filename: process.env.DB_PATH || './data/pt.sqlite3',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './backend/migrations',
    },
  },
};
