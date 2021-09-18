module.exports = {
  preset: "ts-jest",
  // projects: ["<rootDir>/packages/*/jest.config.js"],
  testEnvironment: "jsdom",
  roots: ["<rootDir>"],
  modulePaths: ["<rootDir>"],
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  moduleNameMapper: {
    "@typecell-org/common": "<rootDir>/../common/src",
  },
  setupFiles: ["<rootDir>/src/setupTests.ts"],
};
