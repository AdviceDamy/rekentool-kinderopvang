module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './database.sqlite'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './dist/migrations'
    },
    seeds: {
      directory: './dist/seeds'
    }
  },

  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './dist/migrations'
    },
    seeds: {
      directory: './dist/seeds'
    }
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: './database.sqlite'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './dist/migrations'
    },
    seeds: {
      directory: './dist/seeds'
    }
  }
}; 