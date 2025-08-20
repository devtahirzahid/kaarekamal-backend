const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors"); // Import CORS middleware
const path = require('path'); // Add path module

const app = express();
const Connection = require("./database/db");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const mkpRoutes = require("./routes/mkpRoutes");
const kkMemberRoutes = require("./routes/kkMemberRoutes");
const blogRoutes = require("./routes/blogRoutes");

const PORT = process.env.PORT || 4000;

// Connect to the database
Connection();

// Use CORS middleware with detailed options
app.use(
  cors({
    origin: 'http://localhost:3001', // Replace with your frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/mkp", mkpRoutes);
app.use("/api/kk", kkMemberRoutes);
app.use("/api/blogs", blogRoutes); // Use blog routes

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
