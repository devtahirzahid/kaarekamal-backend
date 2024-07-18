const express = require("express");
var bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();

const Connection = require("./database/db");

const PORT = process.env.PORT || 8000;

const authRoute = require("./routes/auth");

Connection();

app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  // Set CORS headers
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL); // Replace with your frontend domain
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true"); // Allow credentials (cookies, etc.)

  // Pass to next layer of middleware
  next();
});
app.use("/api", authRoute);
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
