const express = require("express");
const {
  createMember,
  getAllMembers,
  getMemberStats,
  getMemberById,
  updateMemberById,
  markMemberRemoved,
  recordRelocation,
  deleteMemberById,
} = require("../controllers/kkMemberController");
const router = express.Router();

router.post("/", createMember);
router.get("/stats/summary", getMemberStats);
router.get("/", getAllMembers);
router.get("/:id", getMemberById);
router.put("/:id", updateMemberById);
router.post("/:id/remove", markMemberRemoved);
router.post("/:id/relocate", recordRelocation);
router.delete("/:id", deleteMemberById);

module.exports = router;
