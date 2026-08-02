const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  coverageProvider: "v8",
  projects: [
    // API route tests run in the Node environment so that the Web Fetch API
    // globals (Request, Response, Headers) are available via Node 18+.
    {
      displayName: "api",
      testEnvironment: "node",
      testMatch: [
        "**/__tests__/market-catalog-route.test.ts",
        "**/__tests__/catalog-litemode-route.test.ts",
      ],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
      },
    },
    // All other tests (services, seeds, React components) use jsdom.
    {
      displayName: "jsdom",
      testEnvironment: "jsdom",
      testMatch: [
        "**/__tests__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test).[jt]s?(x)",
      ],
      testPathIgnorePatterns: [
        "market-catalog-route.test.ts",
        "catalog-litemode-route.test.ts",
      ],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
      },
    },
  ],
};

module.exports = createJestConfig(config);
