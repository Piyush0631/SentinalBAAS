import mongoose from "mongoose";

const db = {
  async connect() {
    const databaseTemplate = process.env.DATABASE;
    const databasePassword = process.env.DATABASE_PASSWORD;

    let databaseUri = process.env.MONGO_URI;

    if (databaseTemplate) {
      databaseUri = databaseTemplate.includes("<PASSWORD>")
        ? databaseTemplate.replace("<PASSWORD>", databasePassword || "")
        : databaseTemplate;
    }

    if (!databaseUri) {
      throw new Error(
        "Database URI missing. Set DATABASE (+ DATABASE_PASSWORD) or MONGO_URI in .env",
      );
    }

    try {
      await mongoose.connect(databaseUri);
      console.log("MongoDB connected");
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);
      throw error;
    }
  },
};

export default db;
