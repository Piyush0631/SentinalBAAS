import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  apiKey: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  recordSchema: {
    type: Object,
    default: null,
  },
});

const ALLOWED_TYPES = ["String", "Number", "Boolean"];
function validateRecordSchemaDefinition(schema) {
  if (!schema || typeof schema !== "object") return;
  for (const [field, rules] of Object.entries(schema)) {
    if (typeof rules !== "object" || !rules.type) {
      throw new Error(
        `Schema for field '${field}' must be an object with a 'type' property`,
      );
    }
    if (!ALLOWED_TYPES.includes(rules.type)) {
      throw new Error(
        `Invalid type '${rules.type}' for field '${field}'. Allowed: ${ALLOWED_TYPES.join(", ")}`,
      );
    }
    if ("required" in rules && typeof rules.required !== "boolean") {
      throw new Error(`'required' for field '${field}' must be a boolean`);
    }
  }
}
// Pre-save middleware to validate recordSchema
projectSchema.pre("save", function (next) {
  try {
    if (this.recordSchema) {
      validateRecordSchemaDefinition(this.recordSchema);
    }
    next();
  } catch (err) {
    next(err);
  }
});

function getRecordSchemaFromUpdate(update = {}) {
  return (
    update.recordSchema ??
    update.$set?.recordSchema ??
    update.$setOnInsert?.recordSchema ??
    null
  );
}

async function validateRecordSchemaOnQuery(next) {
  try {
    const update = this.getUpdate?.() || {};
    const recordSchema = getRecordSchemaFromUpdate(update);

    if (recordSchema) {
      validateRecordSchemaDefinition(recordSchema);
    }

    next();
  } catch (error) {
    next(error);
  }
}

projectSchema.pre(
  ["updateOne", "findOneAndUpdate", "updateMany"],
  validateRecordSchemaOnQuery,
);

export default mongoose.model("Project", projectSchema);
