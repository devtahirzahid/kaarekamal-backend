const express = require("express");

const login = require("../controllers/login");
const createUser = require("../controllers/signup");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

router.post("/signup", createUser);

router.post("/login", login);

router.get("/logout", authenticate, async (req, res) => {
  try {
    const findUser = req?.user;

    if (!findUser) {
      return res.status(404).json({ error: "User not found", status: 404 });
    }

    findUser.tokenBlacklist.push(findUser.token);
    findUser.token = null;
    findUser.lastActive = Date.now();
    await findUser.save();

    console.log("OK 1: ", findUser);

    return res.status(200).json({ message: "Logout successful", status: 200 });
  } catch (error) {
    console.error("Error during logout:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", status: 500 });
  }
  // res.clearCookie("token");
  // res.json({ message: "Logged out" });
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
