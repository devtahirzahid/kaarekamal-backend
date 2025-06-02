const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors"); // Import CORS middleware

const app = express();
const Connection = require("./database/db");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const mkpRoutes = require("./routes/mkpRoutes");
const kkMemberRoutes = require("./routes/kkMemberRoutes");

const PORT = process.env.PORT || 8000;

// Connect to the database
Connection();

// Use CORS middleware with detailed options
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Replace with your frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/mkp", mkpRoutes);
app.use("/api/kk", kkMemberRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
