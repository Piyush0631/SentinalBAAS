module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["./jest.setup.cjs"],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
};
