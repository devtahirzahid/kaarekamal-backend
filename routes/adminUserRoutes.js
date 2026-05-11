const express = require("express");
const { authenticate, requireRootAdmin } = require("../middlewares/auth");
const {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} = require("../controllers/adminUserController");

const router = express.Router();

router.use(authenticate, requireRootAdmin);

router.get("/", listAdminUsers);
router.post("/", createAdminUser);
router.put("/:id", updateAdminUser);
router.delete("/:id", deleteAdminUser);

module.exports = router;
