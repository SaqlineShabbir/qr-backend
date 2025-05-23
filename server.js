require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const visaRoutes = require("./routes/visaRoutes");
const qeRoutes = require("./routes/qrRoute");

const app = express();

// Middleware
app.use(cors({
  origin: '*',              
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],  
  allowedHeaders: ['Content-Type', 'Authorization'], 
}));
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));
// Health check
app.get("/ping", (req, res) => {
  res.send("pong 🏓");
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Routes
app.use("/api/visa", visaRoutes);
app.use("/api/qr", qeRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
