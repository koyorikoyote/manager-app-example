// Server-side Jest setup file
// This file is run before each test in the server project

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://root:root@localhost:3307/manager_app_test';

// Mock uuid module to avoid ES module issues
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123'
}));

// Global test setup
beforeAll(() => {
  // Any global setup for server tests
});

afterAll(() => {
  // Any global cleanup for server tests
});

// Add a dummy test to prevent Jest from complaining about no tests
describe('Jest Setup', () => {
  it('should setup test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});