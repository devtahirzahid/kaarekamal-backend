const mongoose = require('mongoose');

const rationHistorySchema = new mongoose.Schema({
  deliveryDate: { type: Date, required: true, default: Date.now },
  status: {
    type: String,
    enum: ['Provided', 'Not Provided'],
    required: true
  },
  notes: { type: String }
});

const verificationSchema = new mongoose.Schema({
  dateOfDetailsReceived: { type: Date, default: Date.now },
  familyName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  totalMembers: { type: Number, required: true },
  under18Members: { type: Number, required: true },
  houseStatus: { type: String, required: true },
  sourceOfIncome: { type: String, required: true },
  isWidow: { type: Boolean, default: false },
  caseType: { type: String, required: true },
  caseVerifiedDate: { type: Date },
  verifiedBy: { type: String },
  responsibilityOfRationDelivery: { type: String },
  timeDuration: { type: String },
  pdfFile: { type: String }, // Path to the uploaded PDF
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Approved', 'Rejected', 'Ended'],
    default: 'Pending'
  },
  statusNotes: { type: String },
  rationHistory: [rationHistorySchema] 
}, { timestamps: true });

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;
