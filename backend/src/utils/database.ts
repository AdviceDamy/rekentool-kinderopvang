import knex from 'knex';
import path from 'path';

// Load configuration based on environment
const environment = process.env.NODE_ENV || 'development';
const knexConfig = require('../../knexfile')[environment];

// Create database connection
const db = knex(knexConfig);

export default db; 