const mongoose = require("mongoose");


const VisaFormSchema = new mongoose.Schema({
  personalDetails: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    nationality: String,
    maritalStatus: String,
    gender: String
  },
  passportDetails: {
    passportNumber: String,
    dateOfIssue: Date,
    dateOfExpiry: Date,
    placeofIssue: String,
    passportCopy: { type: String },
   
  },
  contactDetails: {
    presentAddress: String,
    permanent: String,
    phone: String, 
    email: String,
    currentOccupation: String,
    employerName: String


  },
  visaDetails: {
    visaType: String,
    purposeofJourney: String,
    noofEntry: String,
    expentryDate: Date,
    noofTravelDoc: Number
  }
}, { timestamps: true });

module.exports = mongoose.model("VisaForm", VisaFormSchema);