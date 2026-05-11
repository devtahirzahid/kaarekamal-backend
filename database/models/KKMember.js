const mongoose = require("mongoose");
const Counter = require("./Counter");

const kkMemberSchema = new mongoose.Schema(
  {
    /**
     * Which intake pipeline this document belongs to (same collection, distinct use-cases).
     * induction = Become a Kamalian (lighter form); kk_member = full KK / official-member registry.
     */
    applicationKind: {
      type: String,
      enum: ["induction", "kk_member"],
      default: "induction",
      index: true,
    },
    /** buffer = pending approval; approved = promoted to OfficialKKMember; rejected = declined */
    applicationStage: {
      type: String,
      enum: ["buffer", "approved", "rejected"],
      default: "buffer",
      index: true,
    },
    approvedAt: { type: Date },
    officialMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OfficialKKMember",
      default: null,
    },
    registrationId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    dateOfJoining: { type: Date },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    cnic: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },
    dateOfBirth: { type: Date },
    fatherName: {
      type: String,
      default: "",
      trim: true,
    },
    guardianContact: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "not_aware"],
      default: "not_aware",
    },
    /** Chapter / current city */
    residentialCity: {
      type: String,
      default: "",
      trim: true,
    },
    chapter: {
      type: String,
      default: "",
      trim: true,
    },
    /** University (aligned with legacy `institution`) */
    institution: {
      type: String,
      default: "",
      trim: true,
    },
    program: {
      type: String,
      default: "",
      trim: true,
    },
    session: {
      type: String,
      default: "",
      trim: true,
    },
    hostellite: {
      type: String,
      enum: ["yes", "no", ""],
      default: "",
    },
    currentAddress: {
      type: String,
      default: "",
      trim: true,
    },
    permanentAddress: {
      type: String,
      default: "",
      trim: true,
    },
    homeTown: {
      type: String,
      default: "",
      trim: true,
    },
    /** Member category / Jobian flag — stored as short text */
    jobian: {
      type: String,
      default: "",
      trim: true,
    },
    motivation: {
      type: String,
      default: "",
    },
    referredBy: {
      type: String,
      default: "",
    },
    activeLocation: {
      type: String,
      enum: ["residential", "hometown", ""],
      default: "residential",
    },
    source: {
      type: String,
      enum: ["social", "friend", "family", "college", "other", ""],
      default: "other",
    },
    memberStatus: {
      type: String,
      enum: ["active", "relocated", "removed"],
      default: "active",
    },
    relocatedFromCity: { type: String, default: "", trim: true },
    relocatedToCity: { type: String, default: "", trim: true },
    relocationRecordedAt: { type: Date },
    removalReason: { type: String, default: "", trim: true },
    removedAt: { type: Date },
  },
  { timestamps: true }
);

kkMemberSchema.pre("save", async function (next) {
  try {
    if (!this.registrationId) {
      const year = new Date().getFullYear();
      const key = `kkMemberReg_${year}`;
      const counter = await Counter.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const n = counter.seq || 1;
      this.registrationId = `KEK-${year}-${String(n).padStart(6, "0")}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

const KKMember = mongoose.model("KKMember", kkMemberSchema);

module.exports = KKMember;
