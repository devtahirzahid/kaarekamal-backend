const express = require("express");

const login = require("../controllers/login");
const createUser = require("../controllers/signup");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

router.post("/signup", createUser);

router.post("/login", login);

router.get("/logout", authenticate, (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

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
