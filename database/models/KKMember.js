const mongoose = require("mongoose");

const kkMemberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    fatherName: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    residentialCity: {
      type: String,
      required: true,
    },
    homeTown: {
      type: String,
      required: true,
    },
    institution: {
      type: String,
      required: true,
    },
    motivation: {
      type: String,
      default: "",
    },
    referredBy: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    activeLocation: {
      type: String,
      enum: ["residential", "hometown"],
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "not_aware"],
      required: true,
    },
    source: {
      type: String,
      enum: ["social", "friend", "family", "college", "other"],
      required: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values while maintaining uniqueness
    },
    cnic: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values while maintaining uniqueness
    },
  },
  { timestamps: true }
);

const KKMember = mongoose.model("KKMember", kkMemberSchema);

module.exports = KKMember;
