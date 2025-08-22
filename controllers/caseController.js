const Case = require('../database/models/case');

// Create a new case
exports.createCase = async (req, res) => {
    try {
        const { 
            date, bloodGroup, disease, pintsRequired, timeLimit, hospital, 
            city, attendantName, attendantContact, pickAndDrop, availability, 
            exchangePossibility, reference, status, statusNotes 
        } = req.body;

        const newCase = new Case({
            date, bloodGroup, disease, pintsRequired, timeLimit, hospital,
            city, attendantName, attendantContact, pickAndDrop, availability,
            exchangePossibility, reference, status, statusNotes
            // caseNo is explicitly omitted here
        });

        await newCase.save();
        res.status(201).json(newCase);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all cases
exports.getAllCases = async (req, res) => {
    try {
        const cases = await Case.find().sort({ createdAt: -1 });
        res.status(200).json(cases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single case by ID
exports.getCaseById = async (req, res) => {
    try {
        const singleCase = await Case.findById(req.params.id);
        if (!singleCase) return res.status(404).json({ message: 'Case not found' });
        res.status(200).json(singleCase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a case (including status changes)
exports.updateCase = async (req, res) => {
    try {
        const { id } = req.params;
        const caseData = req.body;

        const caseToUpdate = await Case.findById(id);
        if (!caseToUpdate) {
            return res.status(404).json({ message: 'Case not found' });
        }

        // If the case is being accepted and doesn't have a case number yet
        if (caseData.status === 'accepted' && !caseToUpdate.caseNo) {
            // Generate a new case number
            const caseCount = await Case.countDocuments({ caseNo: { $exists: true } });
            caseData.caseNo = `BD-${new Date().getFullYear()}-${(caseCount + 1).toString().padStart(4, '0')}`;
        }

        const updatedCase = await Case.findByIdAndUpdate(id, caseData, { new: true });
        res.status(200).json(updatedCase);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a case
exports.deleteCase = async (req, res) => {
    try {
        const deletedCase = await Case.findByIdAndDelete(req.params.id);
        if (!deletedCase) return res.status(404).json({ message: 'Case not found' });
        res.status(200).json({ message: 'Case deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
