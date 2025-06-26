import knex from 'knex';
import path from 'path';

const config = {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../../database.sqlite')
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, '../migrations')
  },
  seeds: {
    directory: path.join(__dirname, '../seeds')
  }
};

const db = knex(config);

export default db; 