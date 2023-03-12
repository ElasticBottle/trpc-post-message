// @ts-check

/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  rootDir: "./test",
  setupFiles: ["./__setup.ts"],
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true,
  },
};
