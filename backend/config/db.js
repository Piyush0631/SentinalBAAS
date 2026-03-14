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

    await mongoose.connect(databaseUri);
    console.log("MongoDB connected");
  },
};

export default db;
