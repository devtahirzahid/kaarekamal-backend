const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    caseNo: {
        type: String,
        unique: true,
        sparse: true,
        default: undefined // Prevent Mongoose from saving null/empty strings
    },
    bloodGroup: {
        type: String,
        required: true
    },
    disease: {
        type: String,
        required: true
    },
    pintsRequired: {
        type: Number,
        required: true
    },
    timeLimit: {
        type: String, // You can also use Date if it's a specific timestamp
        required: true
    },
    hospital: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    attendantName: {
        type: String,
        required: true
    },
    attendantContact: {
        type: String,
        required: true
    },
    pickAndDrop: {
        type: Boolean,
        default: false
    },
    availability: {
        type: Boolean,
        default: true
    },
    exchangePossibility: {
        type: Boolean,
        default: false
    },
    reference: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'done', 'rejected'],
        default: 'pending'
    },
    statusNotes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model("Case", caseSchema);
