const KKMember = require("../database/models/KKMember");

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

  if (next.city && !next.residentialCity) next.residentialCity = next.city;
  if (next.university && !next.institution) next.institution = next.university;

  next.activeLocation = next.activeLocation || "residential";
  next.source = next.source || "other";
  if (next.motivation === undefined) next.motivation = "";
  if (next.referredBy === undefined) next.referredBy = "";
  if (next.fatherName === undefined) next.fatherName = "";
  if (next.homeTown === undefined) next.homeTown = "";
  if (next.cnic === "") delete next.cnic;
  if (next.email === "") delete next.email;

  delete next.city;
  delete next.university;

  return next;
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

exports.createMember = async (req, res) => {
  try {
    const payload = normalizeIncomingBody(req.body);

    if (payload.email) {
      const existing = await KKMember.findOne({ email: payload.email });
      if (existing) {
        return res.status(400).json({
          message: "A member with this email already exists",
        });
      }
    }

    if (payload.cnic) {
      const existing = await KKMember.findOne({ cnic: payload.cnic });
      if (existing) {
        return res.status(400).json({
          message: "A member with this CNIC already exists",
        });
      }
    }

    if (payload.contactNumber) {
      const existing = await KKMember.findOne({
        contactNumber: payload.contactNumber,
      });
      if (existing) {
        return res.status(400).json({
          message: "A member with this contact number already exists",
        });
      }
    }

    const newMember = new KKMember(payload);
    await newMember.save();
    res.status(201).json({
      submission: serializeMember(newMember),
      message: "Member created successfully",
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
    const filter = statusFilter(req.query.status);
    const members = await KKMember.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ submissions: members.map(serializeMember) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMemberStats = async (req, res) => {
  try {
    const total = await KKMember.countDocuments();
    const removed = await KKMember.countDocuments({ memberStatus: "removed" });
    const relocated = await KKMember.countDocuments({ memberStatus: "relocated" });
    const active = await KKMember.countDocuments({
      $or: [
        { memberStatus: "active" },
        { memberStatus: { $exists: false } },
        { memberStatus: null },
        { memberStatus: "" },
      ],
    });

    const topCities = await KKMember.aggregate([
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
      total,
      active,
      relocated,
      removed,
      topCities: topCities.map((r) => ({ city: r._id, count: r.count })),
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
