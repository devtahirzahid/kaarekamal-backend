const express = require('express');
const router = express.Router();
const {
    createBloodDonor,
    getAllBloodDonors,
    getBloodDonorById,
    updateBloodDonor,
    deleteBloodDonor,
    recordDonation,
    getDonorStats,
    searchDonors,
    getEligibleDonors
} = require('../controllers/bloodDonorcontroller');

// Basic CRUD operations
router.post('/', createBloodDonor);
router.get('/', getAllBloodDonors);
router.get('/stats', getDonorStats);
router.get('/search', searchDonors);
router.get('/eligible/:bloodGroup', getEligibleDonors);
router.get('/:id', getBloodDonorById);
router.put('/:id', updateBloodDonor);
router.delete('/:id', deleteBloodDonor);

// Special operations
router.post('/:id/record-donation', recordDonation);

module.exports = router;
