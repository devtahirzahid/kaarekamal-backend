const express = require('express');
const router = express.Router();
const {
  createVerificationCase,
  getAllVerificationCases,
  getVerificationCaseById,
  updateVerificationCase,
  deleteVerificationCase,
  updateVerificationStatus,
  addRationHistoryRecord, // New function for ration history
  uploadPdf,
  validateVerificationData
} = require('../controllers/verificationController');

// Existing routes
router.post('/', validateVerificationData, createVerificationCase);
router.get('/', getAllVerificationCases);
router.get('/:id', getVerificationCaseById);
router.put('/:id', uploadPdf, validateVerificationData, updateVerificationCase);
router.delete('/:id', deleteVerificationCase);

// Status and History routes
router.put('/:id/status', uploadPdf, updateVerificationStatus);
router.post('/:id/ration-history', addRationHistoryRecord); // New route for ration history

module.exports = router;
