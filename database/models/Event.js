const mongoose = require("mongoose");

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    bannerImageUrl: {
      type: String,
      default: "",
    },
    cardImageUrl: {
      type: String,
      default: "",
    },
    // Use these when selecting from bundled app assets (e.g. "/images/event/azm-e-kamal.jpg")
    bannerImagePath: {
      type: String,
      default: "",
    },
    cardImagePath: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

eventSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
  next();
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
