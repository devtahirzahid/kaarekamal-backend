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
  approveBufferMember,
  rejectBufferMember,
  getOfficialMembers,
  getOfficialMemberById,
  updateOfficialMemberById,
  markOfficialRemoved,
  recordOfficialRelocation,
  deleteOfficialMemberById,
} = require("../controllers/kkMemberController");
const router = express.Router();

router.post("/", createMember);
router.get("/stats/summary", getMemberStats);

router.get("/official", getOfficialMembers);
router.get("/official/:officialId", getOfficialMemberById);
router.put("/official/:officialId", updateOfficialMemberById);
router.post("/official/:officialId/remove", markOfficialRemoved);
router.post("/official/:officialId/relocate", recordOfficialRelocation);
router.delete("/official/:officialId", deleteOfficialMemberById);

router.get("/", getAllMembers);
router.post("/:id/approve", approveBufferMember);
router.post("/:id/reject", rejectBufferMember);
router.get("/:id", getMemberById);
router.put("/:id", updateMemberById);
router.post("/:id/remove", markMemberRemoved);
router.post("/:id/relocate", recordRelocation);
router.delete("/:id", deleteMemberById);

module.exports = router;
