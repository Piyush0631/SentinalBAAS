// Script to insert dummy RequestLog entries for testing security report
// Usage: node scripts/seedRequestLogs.js <projectId> <count>

import mongoose from "mongoose";
import RequestLog from "../models/RequestLog.js";

const [, , projectId, countArg] = process.argv;
const count = parseInt(countArg, 10) || 5;

if (!projectId) {
  console.error("Usage: node scripts/seedRequestLogs.js <projectId> <count>");
  process.exit(1);
}

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/sentinelbaas";

async function seedLogs() {
  await mongoose.connect(MONGO_URI);
  const logs = [];
  for (let i = 0; i < count; i++) {
    logs.push({
      projectId,
      method: "POST",
      path: "/api/v1/projects/" + projectId + "/records",
      headers: { "x-api-key": "dummy-key" },
      body: { field: `value${i}` },
      responseStatus: 201,
      ip: `127.0.0.${i + 1}`,
      timestamp: new Date(Date.now() - i * 60000),
    });
  }
  await RequestLog.insertMany(logs);
  console.log(
    `Inserted ${count} dummy RequestLog entries for project ${projectId}`,
  );
  await mongoose.disconnect();
}

seedLogs().catch((err) => {
  console.error(err);
  process.exit(1);
});
