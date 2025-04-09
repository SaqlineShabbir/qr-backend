const express = require("express");
const VisaForm = require("../models/VisaForm");
const multer = require("multer");
const router = express.Router();
const path = require('path');

// Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Create Visa Form
router.post("/", async (req, res) => {
  try {
    const visaForm = new VisaForm(req.body);
    await visaForm.save();
    res.status(201).json(visaForm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Visa Forms
router.get("/", async (req, res) => {
  try {
    const visaForms = await VisaForm.find();
    res.json(visaForms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Visa Form by ID
router.get("/:id", async (req, res) => {
  try {
    const visaForm = await VisaForm.findById(req.params.id);
    if (!visaForm) return res.status(404).json({ error: "Visa form not found" });
    res.json(visaForm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Visa Form by ID
router.put("/:id", async (req, res) => {
  try {
    const visaForm = await VisaForm.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!visaForm) return res.status(404).json({ error: "Visa form not found" });
    res.json(visaForm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update passport details with file upload (Page 2)
router.put("/:id/passport", upload.single('passportCopy'), async (req, res) => {
  try {
    const updateData = {
      passportDetails: {
        ...req.body,
        ...(req.file && { passportCopy: req.file.path }) // Add file path if uploaded
      }
    };

    console.log("Update Data:", updateData);
    console.log("File Info:", req.file);

    const visaForm = await VisaForm.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    console.log("Updated Visa Form:", visaForm);

    if (!visaForm) return res.status(404).json({ error: "Visa form not found" });
    res.json(visaForm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Visa Form by ID
router.delete("/:id", async (req, res) => {
  try {
    const visaForm = await VisaForm.findByIdAndDelete(req.params.id);
    if (!visaForm) return res.status(404).json({ error: "Visa form not found" });
    res.json({ message: "Visa form deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;