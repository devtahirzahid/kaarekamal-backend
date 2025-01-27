const express = require("express");
const {
  createMember,
  getAllMembers,
  getMemberById,
  updateMemberById,
  deleteMemberById,
} = require("../controllers/mkpController");
const router = express.Router();

// Route to create an event
router.post("/", createMember);

// Route to get all events
router.get("/", getAllMembers);

// Route to get a single event by ID
router.get("/:id", getMemberById);

// Route to update an event
router.put("/:id", updateMemberById);

// Route to delete an event
router.delete("/:id", deleteMemberById);

module.exports = router;
