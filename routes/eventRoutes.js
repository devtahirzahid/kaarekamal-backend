const express = require("express");
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

// Route to create an event
router.post("/", createEvent);

// Route to get all events
router.get("/", getAllEvents);

// Route to get a single event by ID
router.get("/:id", getEventById);

// Route to update an event
router.put("/:id", updateEvent);

// Route to delete an event
router.delete("/:id", deleteEvent);

module.exports = router;
