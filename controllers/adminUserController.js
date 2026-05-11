const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../database/models/User");

const SALT_ROUNDS = 10;
const MIN_PASSWORD = 8;

const toPublic = (doc) => ({
  id: doc._id,
  email: doc.email,
  username: doc.username,
  name: doc.name || "",
  role: doc.role,
  createdBy: doc.createdBy || null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const isPrimaryAdmin = (u) => u && u.role === "admin" && !u.createdBy;

/**
 * List admin-role users (password omitted). Root only — enforced by route.
 */
const listAdminUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "admin" })
      .select("-password -token")
      .populate("createdBy", "username email")
      .sort({ createdAt: 1 })
      .lean();

    res.json({ users: users.map((u) => ({ ...toPublic(u), createdBy: u.createdBy || null })) });
  } catch (err) {
    console.error("listAdminUsers:", err);
    res.status(500).json({ message: "Failed to list admin users" });
  }
};

/**
 * Create a delegated admin account (createdBy = primary admin).
 */
const createAdminUser = async (req, res) => {
  const { email, password, username, name } = req.body;

  if (!(email && password && username)) {
    return res.status(400).json({ message: "email, password, and username are required" });
  }
  if (String(password).length < MIN_PASSWORD) {
    return res
      .status(400)
      .json({ message: `Password must be at least ${MIN_PASSWORD} characters` });
  }

  try {
    const exists = await User.findOne({
      $or: [{ email: String(email).trim().toLowerCase() }, { username: String(username).trim() }],
    });
    if (exists) {
      return res.status(409).json({ message: "Email or username already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const doc = await User.create({
      email: String(email).trim().toLowerCase(),
      username: String(username).trim(),
      name: name != null ? String(name).trim() : "",
      password: hashedPassword,
      role: "admin",
      createdBy: req.user._id,
    });

    const created = await User.findById(doc._id)
      .select("-password -token")
      .populate("createdBy", "username email")
      .lean();

    res.status(201).json({ user: { ...toPublic(created), createdBy: created.createdBy || null } });
  } catch (err) {
    console.error("createAdminUser:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email or username already in use" });
    }
    res.status(500).json({ message: "Failed to create admin user" });
  }
};

/**
 * Update an admin user. Cannot remove primary status or change createdBy.
 */
const updateAdminUser = async (req, res) => {
  const { id } = req.params;
  const { email, username, name, password } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    const target = await User.findById(id);
    if (!target || target.role !== "admin") {
      return res.status(404).json({ message: "Admin user not found" });
    }

    if (email != null && String(email).trim()) {
      const e = String(email).trim().toLowerCase();
      const clash = await User.findOne({ email: e, _id: { $ne: target._id } });
      if (clash) return res.status(409).json({ message: "Email already in use" });
      target.email = e;
    }
    if (username != null && String(username).trim()) {
      const u = String(username).trim();
      const clash = await User.findOne({ username: u, _id: { $ne: target._id } });
      if (clash) return res.status(409).json({ message: "Username already in use" });
      target.username = u;
    }
    if (name != null) target.name = String(name).trim();
    if (password != null && String(password).length > 0) {
      if (String(password).length < MIN_PASSWORD) {
        return res
          .status(400)
          .json({ message: `Password must be at least ${MIN_PASSWORD} characters` });
      }
      target.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await target.save();

    const updated = await User.findById(target._id)
      .select("-password -token")
      .populate("createdBy", "username email")
      .lean();

    res.json({ user: { ...toPublic(updated), createdBy: updated.createdBy || null } });
  } catch (err) {
    console.error("updateAdminUser:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email or username already in use" });
    }
    res.status(500).json({ message: "Failed to update admin user" });
  }
};

/**
 * Delete a delegated admin only. Cannot delete primary admins or yourself.
 */
const deleteAdminUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    if (String(req.user._id) === String(id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const target = await User.findById(id);
    if (!target || target.role !== "admin") {
      return res.status(404).json({ message: "Admin user not found" });
    }

    if (isPrimaryAdmin(target)) {
      return res.status(403).json({ message: "Primary administrator accounts cannot be deleted" });
    }

    await User.deleteOne({ _id: target._id });
    res.json({ message: "Admin user removed" });
  } catch (err) {
    console.error("deleteAdminUser:", err);
    res.status(500).json({ message: "Failed to delete admin user" });
  }
};

module.exports = {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
};
