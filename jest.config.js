module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 20000,
  modulePathIgnorePatterns: ['./build/*'],
  setupFiles: ['<rootDir>/jest-setup.js'],
};
