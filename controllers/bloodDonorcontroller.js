const BloodDonor = require('../database/models/bloodDonor');

// Create a new blood donor
exports.createBloodDonor = async (req, res) => {
    try {
        const donorData = req.body;
        
        // Handle initial donation record if provided
        if (donorData.lastDonationDate) {
            donorData.donations = [{ date: donorData.lastDonationDate }];
            delete donorData.lastDonationDate;
        }
        
        const newDonor = new BloodDonor(donorData);
        await newDonor.save();
        res.status(201).json(newDonor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all blood donors with optional filtering
exports.getAllBloodDonors = async (req, res) => {
    try {
        const { bloodGroup, city, status, isAvailable } = req.query;
        let filter = {};
        
        if (bloodGroup) filter.bloodGroup = bloodGroup;
        if (city) filter.city = { $regex: city, $options: 'i' };
        if (status) filter.status = status;
        if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
        
        const donors = await BloodDonor.find(filter).sort({ createdAt: -1 });
        res.status(200).json(donors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single donor by ID
exports.getBloodDonorById = async (req, res) => {
    try {
        const donor = await BloodDonor.findById(req.params.id);
        if (!donor) return res.status(404).json({ message: 'Donor not found' });
        res.status(200).json(donor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a blood donor
exports.updateBloodDonor = async (req, res) => {
    try {
        const donorData = req.body;
        
        // Prevent direct manipulation of the donations array via this endpoint
        delete donorData.donations;

        const updatedDonor = await BloodDonor.findByIdAndUpdate(
            req.params.id, 
            donorData, 
            { new: true, runValidators: true }
        );
        
        if (!updatedDonor) return res.status(404).json({ message: 'Donor not found' });
        res.status(200).json(updatedDonor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a blood donor
exports.deleteBloodDonor = async (req, res) => {
    try {
        const deletedDonor = await BloodDonor.findByIdAndDelete(req.params.id);
        if (!deletedDonor) return res.status(404).json({ message: 'Donor not found' });
        res.status(200).json({ message: 'Donor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Record a blood donation
exports.recordDonation = async (req, res) => {
    try {
        const { donationDate, notes } = req.body;
        const donor = await BloodDonor.findById(req.params.id);
        
        if (!donor) return res.status(404).json({ message: 'Donor not found' });
        
        // Add the new donation to the history
        donor.donations.push({ date: donationDate || new Date(), notes });
        
        await donor.save();
        res.status(200).json(donor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get donor statistics
exports.getDonorStats = async (req, res) => {
    try {
        const stats = await BloodDonor.aggregate([
            {
                $project: {
                    status: 1,
                    isAvailable: 1,
                    totalDonations: { $size: "$donations" } // Calculate total donations from array size
                }
            },
            {
                $group: {
                    _id: null,
                    totalDonors: { $sum: 1 },
                    activeDonors: { 
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    availableDonors: { 
                        $sum: { $cond: ['$isAvailable', 1, 0] }
                    },
                    totalDonations: { $sum: '$totalDonations' }
                }
            }
        ]);
        
        const bloodGroupStats = await BloodDonor.aggregate([
            {
                $project: {
                    bloodGroup: 1,
                    totalDonations: { $size: "$donations" }
                }
            },
            {
                $group: {
                    _id: '$bloodGroup',
                    count: { $sum: 1 },
                    totalDonations: { $sum: '$totalDonations' }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        const cityStats = await BloodDonor.aggregate([
            {
                $group: {
                    _id: '$city',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        
        res.status(200).json({
            overview: stats[0] || {
                totalDonors: 0,
                activeDonors: 0,
                availableDonors: 0,
                totalDonations: 0
            },
            bloodGroupStats,
            cityStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search donors
exports.searchDonors = async (req, res) => {
    try {
        const { query, bloodGroup } = req.query;
        let filter = {};
        
        if (query) {
            filter.$or = [
                { name: { $regex: query, $options: 'i' } },
                { phoneNumber: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { city: { $regex: query, $options: 'i' } }
            ];
        }
        
        if (bloodGroup) {
            filter.bloodGroup = bloodGroup;
        }
        
        const donors = await BloodDonor.find(filter)
            .select('name bloodGroup age city phoneNumber isAvailable status lastDonationDate nextEligibleDate')
            .sort({ name: 1 });
            
        res.status(200).json(donors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get eligible donors for a specific blood group
exports.getEligibleDonors = async (req, res) => {
    try {
        const { bloodGroup } = req.params;
        const today = new Date();
        
        const eligibleDonors = await BloodDonor.find({
            bloodGroup,
            isAvailable: true,
            status: 'active',
            $or: [
                { nextEligibleDate: { $lte: today } },
                { nextEligibleDate: { $exists: false } }
            ]
        }).select('name age phoneNumber city lastDonationDate totalDonations');
        
        res.status(200).json(eligibleDonors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
