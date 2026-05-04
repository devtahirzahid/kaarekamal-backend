const Event = require("../database/models/Event");
const { mapImageUrlForResponse } = require("../utils/cdn");

function pickRawEventImageUrl(obj) {
  return (
    obj.imageUrl ||
    obj.bannerImageUrl ||
    obj.cardImageUrl ||
    ""
  );
}

function pickRawEventImagePath(obj) {
  return obj.bannerImagePath || obj.cardImagePath || "";
}

/** One display image: CDN URL (mapped) or legacy bundled path. */
function resolveDisplayImageForApi(obj) {
  const url = pickRawEventImageUrl(obj);
  if (url) return mapImageUrlForResponse(url);
  return pickRawEventImagePath(obj) || "";
}

function applySingleEventImagePayload(body) {
  if (!body || typeof body !== "object") return body;
  const hasAny =
    Object.prototype.hasOwnProperty.call(body, "imageUrl") ||
    Object.prototype.hasOwnProperty.call(body, "bannerImageUrl") ||
    Object.prototype.hasOwnProperty.call(body, "cardImageUrl");
  if (!hasAny) return body;
  const raw =
    body.imageUrl ?? body.bannerImageUrl ?? body.cardImageUrl ?? "";
  return {
    ...body,
    imageUrl: raw,
    bannerImageUrl: raw,
    cardImageUrl: raw,
  };
}

const serializeEvent = (eventDoc) => {
  if (!eventDoc) return eventDoc;
  const obj = typeof eventDoc.toObject === "function" ? eventDoc.toObject() : eventDoc;
  const display = resolveDisplayImageForApi(obj);
  return {
    ...obj,
    id: obj._id,
    imageUrl: display,
    bannerImageUrl: display,
    cardImageUrl: display,
  };
};

// Create an event
const createEvent = async (req, res) => {
  try {
    const newEvent = new Event(applySingleEventImagePayload(req.body));
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
    const updatedEvent = await Event.findByIdAndUpdate(id, applySingleEventImagePayload(req.body), {
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
