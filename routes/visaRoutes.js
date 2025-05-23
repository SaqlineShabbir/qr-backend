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

// Create Visa Formm
router.post("/", upload.single('photo'), async (req, res) => {
  
  try {
    const formData = {
      personalDetails: {
        ...req.body,
        ...(req.file && { photo: req.file.path }) // Include photo path if file exists
      }
    };

    const visaForm = new VisaForm(formData);
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

router.put("/:id/photo",upload.single('photo'), async (req, res) => {
  try {
    const updateData = {
      personalDetails: {
        ...req.body,
        ...(req.file && { photo: req.file.path }) 
      }
    };

   

    const visaForm = await VisaForm.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    

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

   

    const visaForm = await VisaForm.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    

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


// delete individually 

router.patch("/visa-form/:id/reset-section", async (req, res) => {
  const { section } = req.body; 

  console.log("Section to reset:", section);

  if (!["personalDetails", "passportDetails", "contactDetails", "visaDetails"].includes(section)) {
    return res.status(400).json({ error: "Invalid section name" });
  }

  try {
    const updated = await VisaForm.findByIdAndUpdate(
      req.params.id,
      { $unset: { [section]: "" } }, 
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});



module.exports = router;