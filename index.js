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
const bloodDonorRoutes = require("./routes/bloodDonorRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const PORT = process.env.PORT || 8000;

// Connect to the database
Connection();

// Use CORS middleware with detailed options
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Replace with your frontend domain
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(cookieParser());

// Multipart uploads must not go through json/urlencoded parsers first.
app.use("/api/uploads", uploadRoutes);

// Parse JSON bodies (everything except uploads above)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/mkp", mkpRoutes);
app.use("/api/kk", kkMemberRoutes);
app.use("/api/bdd", bloodDonorRoutes);

// Vercel runs the app as a serverless handler — export for the platform; listen locally only.
module.exports = app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
  });
}
