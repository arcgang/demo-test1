/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^next/link$": "<rootDir>/src/__mocks__/next/link.tsx",
    "^next/image$": "<rootDir>/src/__mocks__/next/image.tsx",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
};

module.exports = config;
