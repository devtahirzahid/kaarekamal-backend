const KKMember = require("../database/models/KKMember");

// Create a new MKP Member
exports.createMember = async (req, res) => {
  try {
    if (req.body.email) {
      const member = await KKMember.findOne({ email: req.body.email });

      if (member) {
        return res.status(400).json({
          message: "You have already submitted the form with this email",
        });
      }
    }

    if (req.body.cnic) {
      const member = await KKMember.findOne({ cnic: req.body.cnic });

      if (member) {
        return res.status(400).json({
          message: "You have already submitted the form with this cnic number",
        });
      }
    }
    const newMember = new KKMember(req.body);
    await newMember.save();
    res
      .status(201)
      .json({ submission: newMember, message: "Form submitted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all MKP Members
exports.getAllMembers = async (req, res) => {
  try {
    const members = await KKMember.find();
    res.status(200).json({ submissions: members });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single MKP Member by ID
exports.getMemberById = async (req, res) => {
  try {
    const member = await KKMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a MKP Member by ID
exports.updateMemberById = async (req, res) => {
  try {
    const updatedMember = await KKMember.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMember) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.status(200).json(updatedMember);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a MKP Member by ID
exports.deleteMemberById = async (req, res) => {
  try {
    const deletedMember = await KKMember.findByIdAndDelete(req.params.id);
    if (!deletedMember) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.status(200).json({ message: "Member deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
