const express = require("express");

const { authenticate } = require("../middlewares/auth");
const { createUser, login, logout, me } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", createUser);

router.post("/login", login);

router.get("/logout", authenticate, logout);

router.get("/me", authenticate, me);

router.get("/profile", authenticate, (req, res) => {
  res.json({
    isAuth: true,
    id: req.user._id,
    email: req.user.email,
    name: req.user.name || req.user.username,
    username: req.user.username,
    role: req.user.role,
    canManageAdminUsers: req.user.role === "admin" && !req.user.createdBy,
  });
});

module.exports = router;
