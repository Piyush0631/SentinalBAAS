import dotenv from "dotenv";
dotenv.config();
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);
let redisHealthy = true;

redis.on("error", (err) => {
  redisHealthy = false;
  console.error("Redis connection error:", {
    name: err?.name,
    message: err?.message,
  });
});

redis.on("ready", () => {
  redisHealthy = true;
});

redis.on("connect", () => {
  redisHealthy = true;
});

export function isRedisHealthy() {
  return redisHealthy;
}

export default redis;
