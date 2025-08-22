const express = require("express");
const router = express.Router();
const caseController = require("../controllers/caseController");

// Create a new case
router.post("/", caseController.createCase);

// Get all cases
router.get("/", caseController.getAllCases);

// Get case by ID
router.get("/:id", caseController.getCaseById);

// Update a case
router.put("/:id", caseController.updateCase);

// Delete a case
router.delete("/:id", caseController.deleteCase);

module.exports = router;

