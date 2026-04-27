const mongoose = require("mongoose");

const bloodDonorSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    cellNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    availability: {
      type: String,
      default: "",
    },
    lastBleedDate: {
      type: String,
      default: "",
    },
    currentStatus: {
      type: String,
      enum: [
        "Available",
        "Not Available",
        "Eligible",
        "Not Eligible",
        "Recently Donated",
        "In Hospital",
      ],
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 100,
    },
  },
  { timestamps: true }
);

// Create index for better search performance
bloodDonorSchema.index({
  name: "text",
  cellNumber: "text",
  currentStatus: "text",
});

const BloodDonor = mongoose.model("BloodDonor", bloodDonorSchema);

module.exports = BloodDonor;
