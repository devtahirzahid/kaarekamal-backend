const express = require('express');
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  uploadEventImage
} = require('../controllers/eventController');

router.post('/', uploadEventImage, createEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.put('/:id', uploadEventImage, updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
