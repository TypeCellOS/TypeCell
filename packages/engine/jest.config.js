module.exports = {
  preset: "ts-jest",
  // transform: {
  //   "^.+\\.(ts|tsx)?$": "ts-jest",
  //   "^.+\\.(js|jsx)$": "babel-jest",
  // },
  // projects: ["<rootDir>/packages/*/jest.config.js"],
  testEnvironment: "jsdom",
  roots: ["<rootDir>"],
  modulePaths: ["<rootDir>"],
  testMatch: [
    "src/**/__tests__/**/*.ts?(x)",
    "src/**/?(*.)+(spec|test).ts?(x)",
  ],
  moduleNameMapper: {
    "@typecell-org/common": "<rootDir>/../common/src",
    "^lib0/([a-zA-Z-]*)$": "<rootDir>/../../node_modules/lib0/dist/$1.cjs",
    "^y-protocols/([a-zA-Z-]*)$":
      "<rootDir>/../../node_modules/y-protocols/dist/$1.cjs",
  },
  setupFiles: ["<rootDir>/src/tests/setupTests.ts"],
};
