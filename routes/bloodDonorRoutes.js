const express = require("express");
const router = express.Router();
const {
  getAllBloodDonors,
  getBloodDonorById,
  createBloodDonor,
  updateBloodDonor,
  deleteBloodDonor,
  importBloodDonors,
  getBloodDonorStats,
} = require("../controllers/bloodDonorController");

// Get all blood donors with search and pagination
router.get("/", getAllBloodDonors);

// Get blood donor statistics
router.get("/stats", getBloodDonorStats);

// Get single blood donor by ID
router.get("/:id", getBloodDonorById);

// Create new blood donor
router.post("/", createBloodDonor);

// Import blood donors from CSV
router.post("/import", importBloodDonors);

// Update blood donor
router.put("/:id", updateBloodDonor);

// Delete blood donor
router.delete("/:id", deleteBloodDonor);

module.exports = router;
