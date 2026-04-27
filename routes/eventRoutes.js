const express = require("express");
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventById,
  getEventBySlug,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

// Route to create an event
router.post("/", createEvent);
// Admin-dashboard legacy aliases
router.post("/create", createEvent);

// Route to get all events
router.get("/", getAllEvents);

// Route to get a single event by ID
router.get("/:id", getEventById);
// Website slug route (must be before /:id only if it could conflict; it doesn't)
router.get("/slug/:slug", getEventBySlug);

// Route to update an event
router.put("/:id", updateEvent);
// Admin-dashboard legacy aliases
router.put("/update/:id", updateEvent);

// Route to delete an event
router.delete("/:id", deleteEvent);
// Admin-dashboard legacy aliases
router.delete("/delete/:id", deleteEvent);

module.exports = router;
