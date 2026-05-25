require("dotenv").config();
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";

jest.mock("./utils/redisClient.js", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ping: jest.fn(),
  },
}));

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST);
});

afterAll(async () => {
  await mongoose.disconnect();
  jest.clearAllMocks();
});
