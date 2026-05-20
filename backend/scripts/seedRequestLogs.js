// Script to insert dummy RequestLog entries for testing security report
// Usage: node scripts/seedRequestLogs.js <projectId> <count>

import mongoose from "mongoose";
import RequestLog from "../models/RequestLog.js";

const [, , projectId, countArg] = process.argv;
const count = parseInt(countArg, 10) || 10;

if (!projectId) {
  console.error("Usage: node scripts/seedRequestLogs.js <projectId> <count>");
  process.exit(1);
}

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/sentinelbaas";

const methods = ["GET", "POST", "PUT", "DELETE"];
const statuses = [200, 201, 400, 401, 404, 500];
const ips = [
  "127.0.0.1",
  "192.168.1.1",
  "203.0.113.1",
  "198.51.100.1",
  "10.0.0.1",
];

async function seedLogs() {
  await mongoose.connect(MONGO_URI);

  const logs = [];
  for (let i = 0; i < count; i++) {
    logs.push({
      projectId,
      method: methods[i % methods.length],
      path: "/api/v1/projects/" + projectId + "/records",
      headers: { "x-api-key": "[REDACTED]" },
      body: { field: `value${i}` },
      responseStatus: statuses[i % statuses.length],
      ip: ips[i % ips.length],
      hadApiKey: i % 5 !== 0, // every 5th request missing API key
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
