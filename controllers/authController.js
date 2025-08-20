const bcrypt = require("bcryptjs");
const env = require("dotenv");
const User = require("../database/models/User");
const { createSecretToken } = require("../tokenGeneration/generateToken");

env.config();

// Login function
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    return res.status(400).json({ message: "All input is required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!(user && (await bcrypt.compare(password, user.password)))) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const token = createSecretToken(user._id);
    user.token = token;
    await user.save();

    res.json({ token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create User function
const createUser = async (req, res) => {
  const { email, password, username } = req.body;

  if (!(email && password && username)) {
    return res.status(400).send("All input is required");
  }

  try {
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    const salt = 10;
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    const token = createSecretToken(user._id);

    newUser.token = token;
    await newUser.save();

    res.json(user);
  } catch (error) {
    console.error("Error during user creation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Logout function
const logout = async (req, res) => {
  try {
    const findUser = req?.user;

    if (!findUser) {
      return res.status(404).json({ error: "User not found", status: 404 });
    }

    findUser.tokenBlacklist.push(findUser.token);
    findUser.token = null;
    findUser.lastActive = Date.now();
    await findUser.save();

    res.status(200).json({ message: "Logged out successfully!", status: 200 });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Internal Server Error", status: 500 });
  }
};

// Export all functions separately
module.exports = {
  login,
  createUser,
  logout,
};
