const express = require("express");

const { authenticate } = require("../middlewares/auth");
const { createUser, login, logout } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", createUser);

router.post("/login", login);

router.get("/logout", authenticate, logout);

router.get("/profile", authenticate, (req, res) => {
  res.json({
    isAuth: true,
    id: req.user._id,
    email: req.user.email,
    name: req.user.username,
    role: req.user.lastname,
  });
});

module.exports = router;
