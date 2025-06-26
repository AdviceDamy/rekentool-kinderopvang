import database from '../utils/database';

// Test database setup
beforeAll(async () => {
  // Run migrations for test database
  await database.migrate.latest();
});

afterAll(async () => {
  // Clean up database connection
  await database.destroy();
});

// Clean up between tests
afterEach(async () => {
  // Clean up test data
  await database('toeslagtabellen').del();
  await database('organisaties').del();
}); 