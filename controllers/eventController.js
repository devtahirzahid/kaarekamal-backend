const Event = require("../database/models/Event");

const serializeEvent = (eventDoc) => {
  if (!eventDoc) return eventDoc;
  const obj = typeof eventDoc.toObject === "function" ? eventDoc.toObject() : eventDoc;
  return { ...obj, id: obj._id };
};

// Create an event
const createEvent = async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res
      .status(201)
      .json({ message: "Event created successfully", event: serializeEvent(newEvent) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get all events
const getAllEvents = async (req, res) => {
  try {
    const { sort = "date", order = "asc" } = req.query;
    const sortDir = String(order).toLowerCase() === "desc" ? -1 : 1;
    const events = await Event.find().sort({ [sort]: sortDir });
    res.status(200).json({ events: events.map(serializeEvent) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get a single event
const getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ data: serializeEvent(event) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get a single event by slug (for website routing)
const getEventBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ data: serializeEvent(event) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Update an event
const updateEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent)
      return res.status(404).json({ message: "Event not found" });

    res
      .status(200)
      .json({ message: "Event updated successfully", data: serializeEvent(updatedEvent) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Delete an event
const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent)
      return res.status(404).json({ message: "Event not found" });

    res
      .status(200)
      .json({ message: "Event deleted successfully", data: serializeEvent(deletedEvent) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  getEventBySlug,
  updateEvent,
  deleteEvent,
};
