import '@testing-library/jest-dom';

beforeEach(() => {
  // Resolve after test-level mocks have been registered.
  require('./api/resource-cache').clearResourceCache();
});
