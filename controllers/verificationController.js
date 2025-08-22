const Verification = require('../database/models/verificationModel');
const multer = require('multer');
const path = require('path');

// Configure Multer for PDF uploads to 'uploads/cases'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/cases/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

exports.uploadPdf = upload.single('pdfFile');

// Pakistan-specific validation functions
const validatePakistanPhoneNumber = (phone) => {
  // Pakistan phone number format: +92-3XX-XXXXXXX or 03XX-XXXXXXX
  const phoneRegex = /^(\+92|0)?[3][0-9]{9}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
};

const validatePakistanCities = (city) => {
  const pakistanCities = [
    'Islamabad', 'Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Hyderabad', 'Gujranwala', 'Peshawar', 'Quetta',
    'Bahawalpur', 'Sargodha', 'Sialkot', 'Sukkur', 'Larkana', 'Sheikhupura', 'Rahim Yar Khan', 'Jhang', 'Dera Ghazi Khan', 'Gujrat',
    'Sahiwal', 'Wah Cantonment', 'Mardan', 'Kasur', 'Okara', 'Mingora', 'Nawabshah', 'Chiniot', 'Kotri', 'Kāmoke',
    'Hafizabad', 'Sadiqabad', 'Mirpur Khas', 'Burewala', 'Kohat', 'Khanewal', 'Dera Ismail Khan', 'Turbat', 'Muzaffargarh', 'Abbottabad',
    'Fazilpur', 'Jhelum', 'Chaman', 'Zhob', 'Mianwali', 'Kot Addu', 'Kamalia', 'Umerkot', 'Ahmedpur East', 'Kotli',
    'Murree', 'Havelian', 'Kahror Pakka', 'Toba Tek Singh', 'Samundri', 'Shahkot', 'Layyah', 'Lodhran', 'Rajanpur', 'Daska',
    'Chakwal', 'Tando Allahyar', 'Attock', 'Vehari', 'Kot Radha Kishan', 'Ferozewala', 'Chak Jhumra', 'Chenab Nagar', 'Ghotki', 'Nankana Sahib',
    'Rafique', 'Jauharabad', 'Hassan Abdal', 'Leiah', 'Bhakkar', 'Dadu', 'Mandi Bahauddin', 'Tando Adam', 'Khairpur', 'Gojra',
    'Mirpur Mathelo', 'Diplo', 'Mian Channu', 'Bahawalnagar', 'Samaro', 'Tandlianwala', 'Harnai', 'Hasilpur', 'Shujaabad', 'Chowk Azam',
    'Kundian', 'Uch Sharif', 'Kanganpur', 'Pir Mahal', 'Jampur', 'Chishtian', 'Daska Kalan', 'Ahmadpur Sial', 'Jalalpur Jattan', 'Haroonabad',
    'Daharki', 'Kharian', 'Mianwali Bangla', 'Muzaffarabad', 'Mirpur', 'Bhimber', 'Kotli', 'Rawalakot', 'Bagh', 'Haveli',
    'Neelum', 'Hattian Bala', 'Hajira', 'Forward Kahuta', 'Chakswari', 'Charhoi', 'Nakyal', 'Sehnsa', 'Khuiratta', 'Kotli Sattian',
    'Leepa', 'Bhimber', 'Samahni', 'Chakswari', 'Charhoi', 'Nakyal', 'Sehnsa', 'Khuiratta', 'Kotli Sattian', 'Leepa'
  ];
  return pakistanCities.some(c => c.toLowerCase() === city.toLowerCase());
};

const validateCaseType = (caseType) => {
  const validCaseTypes = [
    'Financial Assistance', 'Medical Aid', 'Educational Support', 'Housing Support', 
    'Food Ration', 'Emergency Relief', 'Livelihood Support', 'Healthcare', 'Education',
    'Financial Aid', 'Medical Support', 'Educational Aid', 'Housing Aid', 'Food Aid',
    'Emergency Aid', 'Livelihood Aid', 'Healthcare Aid', 'Educational Support',
    'Financial Help', 'Medical Help', 'Educational Help', 'Housing Help', 'Food Help',
    'Emergency Help', 'Livelihood Help', 'Healthcare Help'
  ];
  return validCaseTypes.some(type => type.toLowerCase() === caseType.toLowerCase());
};

const validateHouseStatus = (status) => {
  const validStatuses = [
    'Owned', 'Rented', 'Leased', 'Mortgaged', 'Government Housing', 'Temporary Shelter',
    'Homeless', 'Living with Relatives', 'Refugee Camp', 'Slum Area', 'Katchi Abadi'
  ];
  return validStatuses.some(s => s.toLowerCase() === status.toLowerCase());
};

const validateSourceOfIncome = (source) => {
  const validSources = [
    'Employment', 'Business', 'Agriculture', 'Daily Wage', 'Pension', 'Social Security',
    'Family Support', 'Charity', 'No Income', 'Part-time Job', 'Freelance', 'Remittances',
    'Government Aid', 'NGO Support', 'Religious Institution', 'Community Support'
  ];
  return validSources.some(s => s.toLowerCase() === source.toLowerCase());
};

// Validation middleware
const validateVerificationData = (req, res, next) => {
  const errors = [];
  const data = req.body;

  // Required field validation
  if (!data.familyName || data.familyName.trim().length < 2) {
    errors.push('Family name must be at least 2 characters long');
  }

  if (!data.address || data.address.trim().length < 5) {
    errors.push('Address must be at least 5 characters long');
  }

  if (!data.city || !validatePakistanCities(data.city)) {
    errors.push('Please enter a valid Pakistani city');
  }

  if (!data.phoneNumber || !validatePakistanPhoneNumber(data.phoneNumber)) {
    errors.push('Please enter a valid Pakistani phone number (e.g., 0300-1234567 or +92-300-1234567)');
  }

  if (!data.totalMembers || data.totalMembers < 1 || data.totalMembers > 20) {
    errors.push('Total members must be between 1 and 20');
  }

  if (!data.under18Members || data.under18Members < 0 || data.under18Members > data.totalMembers) {
    errors.push('Under 18 members cannot exceed total members and must be 0 or more');
  }

  if (!data.houseStatus || !validateHouseStatus(data.houseStatus)) {
    errors.push('Please select a valid house status');
  }

  if (!data.sourceOfIncome || !validateSourceOfIncome(data.sourceOfIncome)) {
    errors.push('Please select a valid source of income');
  }

  if (!data.caseType || !validateCaseType(data.caseType)) {
    errors.push('Please select a valid case type');
  }

  // Date validation
  if (data.caseVerifiedDate) {
    const verifiedDate = new Date(data.caseVerifiedDate);
    const receivedDate = new Date(data.dateOfDetailsReceived);
    if (verifiedDate < receivedDate) {
      errors.push('Case verified date cannot be before details received date');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors 
    });
  }

  next();
};

// Create a new verification case (simplified for initial creation)
exports.createVerificationCase = async (req, res) => {
  try {
    // Only a subset of fields are used for initial creation
    const { 
      familyName, address, city, phoneNumber, totalMembers, under18Members, 
      houseStatus, sourceOfIncome, isWidow, caseType 
    } = req.body;
    
    const newCase = new Verification({
      familyName, address, city, phoneNumber, totalMembers, under18Members,
      houseStatus, sourceOfIncome, isWidow, caseType
      // Status will default to 'Pending'
    });

    await newCase.save();
    res.status(201).json(newCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all verification cases
exports.getAllVerificationCases = async (req, res) => {
  try {
    const cases = await Verification.find().sort({ createdAt: -1 });
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single case by ID
exports.getVerificationCaseById = async (req, res) => {
  try {
    const singleCase = await Verification.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });
    res.status(200).json(singleCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a verification case (for editing general details)
exports.updateVerificationCase = async (req, res) => {
  try {
    const caseData = req.body;
    
    // Prevent status from being changed through this endpoint
    delete caseData.status;

    const updatedCase = await Verification.findByIdAndUpdate(req.params.id, caseData, { new: true });
    if (!updatedCase) return res.status(404).json({ message: 'Case not found' });
    res.status(200).json(updatedCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a verification case
exports.deleteVerificationCase = async (req, res) => {
  try {
    const deletedCase = await Verification.findByIdAndDelete(req.params.id);
    if (!deletedCase) return res.status(404).json({ message: 'Case not found' });
    res.status(200).json({ message: 'Case deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// New function to handle status updates
exports.updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verifiedBy, responsibilityOfRationDelivery, timeDuration, statusNotes } = req.body;

    const caseToUpdate = await Verification.findById(id);
    if (!caseToUpdate) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Update fields based on the new status
    caseToUpdate.status = status;
    if (statusNotes) {
      caseToUpdate.statusNotes = statusNotes;
    }

    if (status === 'Accepted') {
      caseToUpdate.verifiedBy = verifiedBy;
      caseToUpdate.caseVerifiedDate = new Date();
      if (req.file) {
        caseToUpdate.pdfFile = `/uploads/cases/${req.file.filename}`;
      }
    } else if (status === 'Approved') {
      caseToUpdate.responsibilityOfRationDelivery = responsibilityOfRationDelivery;
      caseToUpdate.timeDuration = timeDuration;
    }

    const updatedCase = await caseToUpdate.save();
    res.status(200).json(updatedCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// New function to add a ration history record
exports.addRationHistoryRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryDate, status, notes } = req.body;

    const caseToUpdate = await Verification.findById(id);
    if (!caseToUpdate) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseToUpdate.status === 'Ended') {
      return res.status(400).json({ message: 'This case has been ended. No new ration history can be added.' });
    }
    
    caseToUpdate.rationHistory.push({ deliveryDate, status, notes });
    
    const updatedCase = await caseToUpdate.save();
    res.status(200).json(updatedCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Export validation middleware
exports.validateVerificationData = validateVerificationData;
