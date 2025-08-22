const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    }
});

const bloodDonorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    bloodGroup: {
        type: String,
        required: true,
        enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },
    age: {
        type: Number,
        required: true,
        min: 18,
        max: 65
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Other']
    },
    phoneNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    donations: [donationSchema], // Replaces lastDonationDate and totalDonations
    isAvailable: {
        type: Boolean,
        default: true
    },
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },
    medicalHistory: {
        hasDiabetes: { type: Boolean, default: false },
        hasHypertension: { type: Boolean, default: false },
        hasHeartDisease: { type: Boolean, default: false },
        hasHepatitis: { type: Boolean, default: false },
        hasHIV: { type: Boolean, default: false },
        otherConditions: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'temporarily_unavailable'],
        default: 'active'
    },
    notes: {
        type: String
    }
}, { timestamps: true });

// Virtual for total donations
bloodDonorSchema.virtual('totalDonations').get(function() {
    return this.donations.length;
});

// Virtual for last donation date
bloodDonorSchema.virtual('lastDonationDate').get(function() {
    if (this.donations && this.donations.length > 0) {
        // Sort donations by date descending to get the latest one
        return [...this.donations].sort((a, b) => b.date - a.date)[0].date;
    }
    return null;
});

// Virtual for next eligible date
bloodDonorSchema.virtual('nextEligibleDate').get(function() {
    const lastDonation = this.lastDonationDate;
    if (lastDonation) {
        const nextDate = new Date(lastDonation);
        nextDate.setMonth(nextDate.getMonth() + 3);
        return nextDate;
    }
    return null;
});

// Method to check if donor is eligible to donate
bloodDonorSchema.methods.isEligibleToDonate = function() {
    if (!this.isAvailable || this.status !== 'active') {
        return false;
    }
    
    const nextEligible = this.nextEligibleDate;
    if (nextEligible) {
        return new Date() >= nextEligible;
    }
    
    return true;
};

// Ensure virtuals are included when converting to JSON
bloodDonorSchema.set('toJSON', { virtuals: true });
bloodDonorSchema.set('toObject', { virtuals: true });


module.exports = mongoose.model("BloodDonor", bloodDonorSchema);
