const mongoose = require("mongoose");

const TempVisaFormSchema = new mongoose.Schema({
  formData: {
    type: Object,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Automatically delete document when expiresAt is reached
  }
});

module.exports = mongoose.model("TempVisaForm", TempVisaFormSchema);