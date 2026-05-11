const KKMember = require("../database/models/KKMember");
const OfficialKKMember = require("../database/models/OfficialKKMember");

function toObject(doc) {
  if (!doc) return doc;
  return typeof doc.toObject === "function" ? doc.toObject() : doc;
}

function serializeMember(doc) {
  const o = toObject(doc);
  if (!o) return o;
  return { ...o, id: o._id };
}

/** Map admin/public aliases and legacy defaults so creates stay valid. */
function normalizeIncomingBody(body) {
  if (!body || typeof body !== "object") return body;
  const next = { ...body };
  delete next.registrationId;
  delete next.applicationStage;
  delete next.officialMemberId;
  delete next.approvedAt;

  if (next.city && !next.residentialCity) next.residentialCity = next.city;
  if (next.university && !next.institution) next.institution = next.university;

  if (next.cnic === "") delete next.cnic;
  if (next.email === "") delete next.email;

  delete next.city;
  delete next.university;

  return next;
}

function trimStr(v) {
  return String(v == null ? "" : v).trim();
}

function isValidDateInput(v) {
  if (!trimStr(v)) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
}

function normalizeCnicDigits(v) {
  return String(v == null ? "" : v).replace(/\D/g, "");
}

/** Stored CNIC may be 13 digits or #####-#######-# — match duplicates across formats. */
function cnicLookupValues(d13) {
  if (!d13 || d13.length !== 13) return [];
  const dashed = `${d13.slice(0, 5)}-${d13.slice(5, 12)}-${d13.slice(12)}`;
  return [d13, dashed];
}

function normalizeJobianServer(v) {
  const s = trimStr(v).toLowerCase();
  if (!s) return "";
  if (["yes", "y", "true", "1"].includes(s)) return "yes";
  if (["no", "n", "false", "0"].includes(s)) return "no";
  if (["n_a", "n/a", "na", "not applicable", "n.a"].includes(s)) return "n_a";
  return "";
}

const PHONE_RE = /^\+?[0-9\s\-]+$/;
const GENDERS = new Set(["male", "female", "other"]);
const SOURCES = new Set(["social", "friend", "family", "college", "other"]);
const BLOOD = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "not_aware"]);
const ACTIVE_LOC = new Set(["residential", "hometown"]);

/** Full application required for new buffer members (public form + API contract). */
function assertCompleteBufferCreate(p) {
  if (!trimStr(p.fullName)) return "Full name is required";
  if (!trimStr(p.contactNumber)) return "Contact number is required";
  if (!PHONE_RE.test(trimStr(p.contactNumber))) return "Enter a valid contact number";
  if (!trimStr(p.fatherName)) return "Father's name is required";
  if (!trimStr(p.guardianContact)) return "Guardian's contact is required";
  if (!PHONE_RE.test(trimStr(p.guardianContact))) return "Enter a valid guardian's contact number";
  if (!isValidDateInput(p.dateOfBirth)) return "Date of birth is required";
  if (!isValidDateInput(p.dateOfJoining)) return "Date of joining is required";
  if (!GENDERS.has(p.gender)) return "Gender is required";
  if (!trimStr(p.residentialCity)) return "City (chapter) is required";
  if (!trimStr(p.chapter)) return "Chapter name is required";
  if (!BLOOD.has(p.bloodGroup)) return "Blood group is required";
  if (!trimStr(p.institution)) return "University is required";
  if (!trimStr(p.program)) return "Program is required";
  if (!trimStr(p.session)) return "Session is required";
  if (p.hostellite !== "yes" && p.hostellite !== "no") return "Hostellite (Yes / No) is required";
  if (!trimStr(p.currentAddress)) return "Current address is required";
  if (!trimStr(p.permanentAddress)) return "Permanent address is required";
  if (!trimStr(p.homeTown)) return "Hometown is required";
  if (!ACTIVE_LOC.has(p.activeLocation)) return "Where you can actively participate is required";
  if (!SOURCES.has(p.source)) return "How did you hear about us is required";
  if (!trimStr(p.referredBy)) return "Referred by is required";
  if (!trimStr(p.motivation)) return "Motivation is required";
  const cnicDigits = normalizeCnicDigits(p.cnic);
  if (cnicDigits.length !== 13) return "CNIC must be 13 digits";
  const job = normalizeJobianServer(p.jobian);
  if (!["yes", "no", "n_a"].includes(job)) return "Jobian is required";
  return null;
}

function statusFilter(status) {
  const s = String(status || "").toLowerCase();
  if (s === "removed") return { memberStatus: "removed" };
  if (s === "relocated") return { memberStatus: "relocated" };
  if (s === "active") {
    return {
      $or: [
        { memberStatus: "active" },
        { memberStatus: { $exists: false } },
        { memberStatus: null },
        { memberStatus: "" },
      ],
    };
  }
  return {};
}

/** Applications (KKMember) pool: buffer | approved | rejected | all */
function poolFilter(pool) {
  const p = String(pool || "buffer").toLowerCase();
  if (p === "all") return {};
  if (p === "approved") return { applicationStage: "approved" };
  if (p === "rejected") return { applicationStage: "rejected" };
  return {
    $or: [
      { applicationStage: "buffer" },
      { applicationStage: { $exists: false } },
      { applicationStage: null },
      { applicationStage: "" },
    ],
  };
}

function mergeAndFilters(a, b) {
  const hasA = a && Object.keys(a).length > 0;
  const hasB = b && Object.keys(b).length > 0;
  if (hasA && hasB) return { $and: [a, b] };
  if (hasA) return a;
  if (hasB) return b;
  return {};
}

function serializeOfficial(doc) {
  const o = toObject(doc);
  if (!o) return o;
  return { ...o, id: o._id };
}

const ACTIVE_BUFFER_STAGE = {
  $or: [
    { applicationStage: "buffer" },
    { applicationStage: "rejected" },
    { applicationStage: { $exists: false } },
    { applicationStage: null },
    { applicationStage: "" },
  ],
};

/** Block new applications if contact/email/cnic is in buffer (non-approved) or on official roster. */
async function contactTakenForNewApplication({ contactNumber, email, cnic }) {
  if (contactNumber) {
    const [b, o] = await Promise.all([
      KKMember.findOne({ contactNumber, ...ACTIVE_BUFFER_STAGE }),
      OfficialKKMember.findOne({ contactNumber }),
    ]);
    if (b || o) return "contactNumber";
  }
  if (email) {
    const [b, o] = await Promise.all([
      KKMember.findOne({ email, ...ACTIVE_BUFFER_STAGE }),
      OfficialKKMember.findOne({ email }),
    ]);
    if (b || o) return "email";
  }
  const cnicDigits = cnic ? normalizeCnicDigits(cnic) : "";
  if (cnicDigits.length === 13) {
    const variants = cnicLookupValues(cnicDigits);
    const [b, o] = await Promise.all([
      KKMember.findOne({ cnic: { $in: variants }, ...ACTIVE_BUFFER_STAGE }),
      OfficialKKMember.findOne({ cnic: { $in: variants } }),
    ]);
    if (b || o) return "cnic";
  }
  return null;
}

exports.createMember = async (req, res) => {
  try {
    const payload = normalizeIncomingBody(req.body);
    [
      "memberStatus",
      "removedAt",
      "removalReason",
      "relocatedFromCity",
      "relocatedToCity",
      "relocationRecordedAt",
    ].forEach((k) => delete payload[k]);

    const emailTrimmed = String(payload.email || "").trim();
    if (!emailTrimmed) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    payload.email = emailTrimmed.toLowerCase();

    payload.cnic = normalizeCnicDigits(payload.cnic);
    const completenessErr = assertCompleteBufferCreate(payload);
    if (completenessErr) {
      return res.status(400).json({ message: completenessErr });
    }
    payload.jobian = normalizeJobianServer(payload.jobian);

    const taken = await contactTakenForNewApplication({
      contactNumber: payload.contactNumber,
      email: payload.email,
      cnic: payload.cnic,
    });
    if (taken === "contactNumber") {
      return res.status(400).json({
        message:
          "This contact number is already used in an open application or on the official roster",
      });
    }
    if (taken === "email") {
      return res.status(400).json({
        message: "This email is already used in an open application or on the official roster",
      });
    }
    if (taken === "cnic") {
      return res.status(400).json({
        message: "This CNIC is already used in an open application or on the official roster",
      });
    }

    const newMember = new KKMember({ ...payload, applicationStage: "buffer" });
    await newMember.save();
    res.status(201).json({
      submission: serializeMember(newMember),
      message: "Application received. An administrator will review it for approval.",
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      let message = "Duplicate entry";
      if (field === "contactNumber") message = "Duplicate contact number";
      else if (field === "email") message = "Duplicate email";
      else if (field === "cnic") message = "Duplicate CNIC";
      else if (field === "registrationId") message = "Duplicate registration ID";
      return res.status(400).json({ message });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.getAllMembers = async (req, res) => {
  try {
    const filter = mergeAndFilters(poolFilter(req.query.pool), statusFilter(req.query.status));
    const members = await KKMember.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ submissions: members.map(serializeMember) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMemberStats = async (req, res) => {
  try {
    const bufferFilter = poolFilter("buffer");
    const bufferApplications = await KKMember.countDocuments(bufferFilter);

    const officialTotal = await OfficialKKMember.countDocuments();
    const officialRemoved = await OfficialKKMember.countDocuments({ memberStatus: "removed" });
    const officialRelocated = await OfficialKKMember.countDocuments({ memberStatus: "relocated" });
    const officialActive = await OfficialKKMember.countDocuments({
      $or: [
        { memberStatus: "active" },
        { memberStatus: { $exists: false } },
        { memberStatus: null },
        { memberStatus: "" },
      ],
    });

    const topCities = await OfficialKKMember.aggregate([
      {
        $match: {
          residentialCity: { $nin: [null, ""] },
          memberStatus: { $nin: ["removed"] },
        },
      },
      { $group: { _id: "$residentialCity", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    res.status(200).json({
      bufferApplications,
      officialTotal,
      officialActive,
      officialRelocated,
      officialRemoved,
      topCities: topCities.map((r) => ({ city: r._id, count: r.count })),
      // legacy keys for older dashboards
      total: officialTotal,
      active: officialActive,
      relocated: officialRelocated,
      removed: officialRemoved,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const member = await KKMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.status(200).json(serializeMember(member));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMemberById = async (req, res) => {
  try {
    const payload = normalizeIncomingBody(req.body);
    if (payload.cnic === "") delete payload.cnic;
    if (payload.email === "") delete payload.email;

    const member = await KKMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    Object.assign(member, payload);
    await member.save();
    res.status(200).json(serializeMember(member));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Duplicate email, CNIC, or contact number" });
    }
    res.status(400).json({ message: error.message });
  }
};

/** Mark member removed (soft status + reason). */
exports.markMemberRemoved = async (req, res) => {
  try {
    const { removalReason } = req.body || {};
    if (!String(removalReason || "").trim()) {
      return res.status(400).json({ message: "Removal reason is required" });
    }
    const updated = await KKMember.findByIdAndUpdate(
      req.params.id,
      {
        memberStatus: "removed",
        removalReason: String(removalReason).trim(),
        removedAt: new Date(),
      },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Member not found" });
    res.status(200).json(serializeMember(updated));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/** Record relocation to another city/chapter. */
exports.recordRelocation = async (req, res) => {
  try {
    const { relocatedToCity, relocatedFromCity } = req.body || {};
    const toCity = String(relocatedToCity || "").trim();
    if (!toCity) {
      return res.status(400).json({ message: "New city (relocatedToCity) is required" });
    }
    const member = await KKMember.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    const fromCity =
      String(relocatedFromCity || "").trim() ||
      member.residentialCity ||
      member.homeTown ||
      "";

    member.memberStatus = "relocated";
    member.relocatedFromCity = fromCity;
    member.relocatedToCity = toCity;
    member.relocationRecordedAt = new Date();
    member.residentialCity = toCity;
    await member.save();

    res.status(200).json(serializeMember(member));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteMemberById = async (req, res) => {
  try {
    const deletedMember = await KKMember.findByIdAndDelete(req.params.id);
    if (!deletedMember) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.status(200).json({ message: "Member deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveBufferMember = async (req, res) => {
  try {
    const buffer = await KKMember.findById(req.params.id);
    if (!buffer) {
      return res.status(404).json({ message: "Application not found" });
    }
    const stage = buffer.applicationStage || "buffer";
    if (stage === "approved") {
      return res.status(400).json({ message: "Application already approved" });
    }
    if (stage === "rejected") {
      return res.status(400).json({ message: "Application was rejected" });
    }

    const existingOff = await OfficialKKMember.findOne({ sourceKkMemberId: buffer._id });
    if (existingOff) {
      return res.status(400).json({ message: "Official roster record already exists" });
    }

    const plain = buffer.toObject();
    delete plain._id;
    delete plain.__v;
    delete plain.applicationStage;
    delete plain.approvedAt;
    delete plain.officialMemberId;
    delete plain.registrationId;
    delete plain.createdAt;
    delete plain.updatedAt;

    const official = new OfficialKKMember({
      ...plain,
      sourceKkMemberId: buffer._id,
      approvedAt: new Date(),
    });
    await official.save();

    buffer.applicationStage = "approved";
    buffer.approvedAt = new Date();
    buffer.officialMemberId = official._id;
    await buffer.save();

    res.status(201).json({
      message: "Approved to official roster",
      official: serializeOfficial(official),
      application: serializeMember(buffer),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate field on official roster (email, CNIC, or contact may already exist)",
      });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.rejectBufferMember = async (req, res) => {
  try {
    const m = await KKMember.findById(req.params.id);
    if (!m) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (m.applicationStage === "approved") {
      return res.status(400).json({ message: "Cannot reject an approved application" });
    }
    m.applicationStage = "rejected";
    await m.save();
    res.status(200).json(serializeMember(m));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getOfficialMembers = async (req, res) => {
  try {
    const filter = statusFilter(req.query.status);
    const members = await OfficialKKMember.find(filter).sort({ approvedAt: -1, createdAt: -1 });
    res.status(200).json({ officials: members.map(serializeOfficial) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOfficialMemberById = async (req, res) => {
  try {
    const m = await OfficialKKMember.findById(req.params.officialId);
    if (!m) {
      return res.status(404).json({ message: "Official member not found" });
    }
    res.status(200).json(serializeOfficial(m));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function normalizeOfficialBody(body) {
  if (!body || typeof body !== "object") return body;
  const next = { ...body };
  delete next.registrationId;
  delete next.sourceKkMemberId;
  delete next.approvedAt;
  return next;
}

exports.updateOfficialMemberById = async (req, res) => {
  try {
    const payload = normalizeOfficialBody(normalizeIncomingBody(req.body));
    if (payload.cnic === "") delete payload.cnic;
    if (payload.email === "") delete payload.email;

    const m = await OfficialKKMember.findById(req.params.officialId);
    if (!m) {
      return res.status(404).json({ message: "Official member not found" });
    }
    Object.assign(m, payload);
    await m.save();
    res.status(200).json(serializeOfficial(m));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Duplicate email, CNIC, or contact number" });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.markOfficialRemoved = async (req, res) => {
  try {
    const { removalReason } = req.body || {};
    if (!String(removalReason || "").trim()) {
      return res.status(400).json({ message: "Removal reason is required" });
    }
    const updated = await OfficialKKMember.findByIdAndUpdate(
      req.params.officialId,
      {
        memberStatus: "removed",
        removalReason: String(removalReason).trim(),
        removedAt: new Date(),
      },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Official member not found" });
    }
    res.status(200).json(serializeOfficial(updated));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.recordOfficialRelocation = async (req, res) => {
  try {
    const { relocatedToCity, relocatedFromCity } = req.body || {};
    const toCity = String(relocatedToCity || "").trim();
    if (!toCity) {
      return res.status(400).json({ message: "New city (relocatedToCity) is required" });
    }
    const m = await OfficialKKMember.findById(req.params.officialId);
    if (!m) {
      return res.status(404).json({ message: "Official member not found" });
    }
    const fromCity =
      String(relocatedFromCity || "").trim() || m.residentialCity || m.homeTown || "";

    m.memberStatus = "relocated";
    m.relocatedFromCity = fromCity;
    m.relocatedToCity = toCity;
    m.relocationRecordedAt = new Date();
    m.residentialCity = toCity;
    await m.save();

    res.status(200).json(serializeOfficial(m));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteOfficialMemberById = async (req, res) => {
  try {
    const deleted = await OfficialKKMember.findByIdAndDelete(req.params.officialId);
    if (!deleted) {
      return res.status(404).json({ message: "Official member not found" });
    }
    res.status(200).json({ message: "Official member deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
