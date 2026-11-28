const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  // Pins the suite's time zone before any worker initialises ICU — see the file.
  globalSetup: '<rootDir>/jest.global-setup.cjs',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    // `marked` exports ESM only, which Jest does not transform; its UMD build is the same code.
    '^marked$': '<rootDir>/node_modules/marked/lib/marked.umd.js',
  },
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = createJestConfig(customJestConfig);
