const express = require("express");
const VisaForm = require("../models/VisaForm");
const router = express.Router();

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