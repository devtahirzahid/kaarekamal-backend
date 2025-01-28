const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const mkpMemberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    fatherName: {
      type: String,
      required: true,
    },
    cnic: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    residentialCity: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    workingWith: {
      type: String,
      required: true,
    },
    cityType: {
      type: String,
      required: true,
    },
    kamalian: {
      type: String,
      required: true,
    },
    pastExp: {
      type: String,
      required: true,
    },
    reasonForChapter: {
      type: String,
      required: true,
    },
    referredBy: {
      type: String,
    },
  },
  { timestamps: true }
);

const MKPMember = mongoose.model("MKPMember", mkpMemberSchema);

module.exports = MKPMember;
