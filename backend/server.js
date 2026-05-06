import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import db from "./config/db.js";
import { validateEnv } from "./config/envValidator.js";
import redis from "./utils/redisClient.js";

validateEnv();

const PORT = process.env.PORT || 7000;
let server;

const startServer = async () => {
  try {
    await db.connect();
    redis
      .ping()
      .then((result) => {
        if (result === "PONG") {
          console.log("Redis connected");
        } else {
          console.warn("Redis ping failed:", result);
        }
      })
      .catch((err) => {
        console.error("Redis connection error:", err.message);
      });

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (error) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(error.name, error.message);

  if (server) {
    server.close(() => {
      process.exit(1);
    });

    return;
  }

  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");

  if (server) {
    server.close(() => {
      process.exit(0);
    });

    return;
  }

  process.exit(0);
});
