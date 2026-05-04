const mongoose = require("mongoose");

/** Atomic sequence for KK registration IDs (e.g. KEK-2026-000001). */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { collection: "counters" }
);

module.exports = mongoose.models.Counter || mongoose.model("Counter", counterSchema);
