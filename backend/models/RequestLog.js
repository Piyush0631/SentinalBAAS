import mongoose from "mongoose";

const requestLogSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  method: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  headers: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    // Sensitive fields (API keys, tokens, passwords) must be sanitized before logging
  },
  body: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    // Sensitive fields must be sanitized before logging
  },
  responseStatus: {
    type: Number,
    required: false,
  },
  ip: {
    type: String,
    required: false,
  },
  hadApiKey: {
    type: Boolean,
    default: false,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

requestLogSchema.index({ projectId: 1, timestamp: -1 });
requestLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
);

export default mongoose.model("RequestLog", requestLogSchema);
