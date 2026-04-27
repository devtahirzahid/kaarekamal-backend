const BloodDonor = require("../database/models/BloodDonor");

// Get all blood donors
const getAllBloodDonors = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { cellNumber: { $regex: search, $options: "i" } },
        { currentStatus: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      query.currentStatus = status;
    }

    const skip = (page - 1) * limit;

    const donors = await BloodDonor.find(query)
      .sort({ caseNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BloodDonor.countDocuments(query);

    res.status(200).json({
      success: true,
      data: donors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blood donors:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single blood donor by ID
const getBloodDonorById = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await BloodDonor.findById(id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Blood donor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: donor,
    });
  } catch (error) {
    console.error("Error fetching blood donor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create new blood donor
const createBloodDonor = async (req, res) => {
  try {
    const {
      caseNumber,
      name,
      cellNumber,
      address,
      availability,
      lastBleedDate,
      currentStatus,
      age,
    } = req.body;

    // Check if case number already exists
    const existingDonor = await BloodDonor.findOne({ caseNumber });
    if (existingDonor) {
      return res.status(400).json({
        success: false,
        message: "Case number already exists",
      });
    }

    const newDonor = new BloodDonor({
      caseNumber,
      name,
      cellNumber,
      address,
      availability,
      lastBleedDate,
      currentStatus,
      age,
    });

    const savedDonor = await newDonor.save();

    res.status(201).json({
      success: true,
      message: "Blood donor created successfully",
      data: savedDonor,
    });
  } catch (error) {
    console.error("Error creating blood donor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update blood donor
const updateBloodDonor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If case number is being updated, check for duplicates
    if (updateData.caseNumber) {
      const existingDonor = await BloodDonor.findOne({
        caseNumber: updateData.caseNumber,
        _id: { $ne: id },
      });
      if (existingDonor) {
        return res.status(400).json({
          success: false,
          message: "Case number already exists",
        });
      }
    }

    const updatedDonor = await BloodDonor.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedDonor) {
      return res.status(404).json({
        success: false,
        message: "Blood donor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blood donor updated successfully",
      data: updatedDonor,
    });
  } catch (error) {
    console.error("Error updating blood donor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete blood donor
const deleteBloodDonor = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedDonor = await BloodDonor.findByIdAndDelete(id);

    if (!deletedDonor) {
      return res.status(404).json({
        success: false,
        message: "Blood donor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blood donor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blood donor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Import blood donors from CSV
const importBloodDonors = async (req, res) => {
  try {
    const { donors } = req.body;

    if (!Array.isArray(donors) || donors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format or empty array",
      });
    }

    const results = {
      success: [],
      errors: [],
    };

    for (const donorData of donors) {
      try {
        // Check if case number already exists
        const existingDonor = await BloodDonor.findOne({
          caseNumber: donorData.caseNumber,
        });
        if (existingDonor) {
          results.errors.push({
            caseNumber: donorData.caseNumber,
            error: "Case number already exists",
          });
          continue;
        }

        const newDonor = new BloodDonor(donorData);
        const savedDonor = await newDonor.save();
        results.success.push(savedDonor);
      } catch (error) {
        results.errors.push({
          caseNumber: donorData.caseNumber,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Import completed. ${results.success.length} donors imported successfully, ${results.errors.length} errors.`,
      data: results,
    });
  } catch (error) {
    console.error("Error importing blood donors:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get blood donor statistics
const getBloodDonorStats = async (req, res) => {
  try {
    const totalDonors = await BloodDonor.countDocuments();
    const availableDonors = await BloodDonor.countDocuments({
      currentStatus: "Available",
    });
    const eligibleDonors = await BloodDonor.countDocuments({
      currentStatus: "Eligible",
    });
    const recentlyDonated = await BloodDonor.countDocuments({
      currentStatus: "Recently Donated",
    });
    const inHospital = await BloodDonor.countDocuments({
      currentStatus: "In Hospital",
    });

    res.status(200).json({
      success: true,
      data: {
        totalDonors,
        availableDonors,
        eligibleDonors,
        recentlyDonated,
        inHospital,
        notAvailable:
          totalDonors -
          availableDonors -
          eligibleDonors -
          recentlyDonated -
          inHospital,
      },
    });
  } catch (error) {
    console.error("Error fetching blood donor statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getAllBloodDonors,
  getBloodDonorById,
  createBloodDonor,
  updateBloodDonor,
  deleteBloodDonor,
  importBloodDonors,
  getBloodDonorStats,
};
