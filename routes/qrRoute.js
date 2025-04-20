const express = require("express");
const QRCodeModel = require("../models/Qr");
const crypto = require("crypto");
const mongoose = require("mongoose");

const router = express.Router();
const QR_EXPIRY_MINUTES = 5;

// Helper function for error responses
const errorResponse = (res, status, message) => {
  return res.status(status).json({ 
    success: false,
    error: message 
  });
};

// Generate QR Code
router.post("/generate", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { visaId, page } = req.body;
    
    if (!visaId || !page) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Both visaId and page are required");
    }

    // First check if a used code exists
    const usedCodeExists = await QRCodeModel.findOne({
      visaId,
      page,
      status: QRCodeModel.QRStatus.USED
    }, null, { session });

    if (usedCodeExists) {
      await session.abortTransaction();
      return errorResponse(res, 403, "QR code for this page has already been used");
    }

    // Invalidate any existing active codes for this visaId+page
    await QRCodeModel.updateMany(
      { visaId, page, status: QRCodeModel.QRStatus.ACTIVE },
      { $set: { status: QRCodeModel.QRStatus.INVALIDATED } },
      { session }
    );

    // Generate new code
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000);
    
    const qrCode = new QRCodeModel({ 
      token, 
      page, 
      visaId,
      status: QRCodeModel.QRStatus.ACTIVE,
      expiresAt
    });
    
    await qrCode.save({ session });
    await session.commitTransaction();
    
    res.json({ 
      success: true,
      qrUrl: `${process.env.FRONTEND_URL}/${page}/${visaId}?token=${token}`,
      token,
      expiresAt: expiresAt.toISOString(),
      page
    });

  } catch (err) {
    await session.abortTransaction();
    console.error("QR Generation Error:", err);
    errorResponse(res, 500, "Failed to generate QR code");
  } finally {
    session.endSession();
  }
});



// New endpoint to check if QR can be generated
router.get('/can-generate/:visaId/:page', async (req, res) => {
  try {
    const { visaId, page } = req.params;
    
    const existing = await QRCodeModel.findOne({
      visaId,
      page,
      status: QRCodeModel.QRStatus.USED
    });

    res.json({
      success: true,
      canGenerate: !existing
    });

  } catch (error) {
    console.error("CanGenerate Error:", error);
    errorResponse(res, 500, "Failed to check generation status");
  }
});

router.get('/active/:visaId/:page', async (req, res) => {
  try {
    const { visaId, page } = req.params;
    
    const activeQR = await QRCodeModel.findOne({
      visaId,
      page,
      status: QRCodeModel.QRStatus.ACTIVE,
      expiresAt: { $gt: new Date() }
    });

    res.json({
      success: true,
      exists: !!activeQR,
      qrData: activeQR ? {
        token: activeQR.token,
        expiresAt: activeQR.expiresAt
      } : null
    });
  } catch (error) {
    console.error("Active QR Check Error:", error);
    errorResponse(res, 500, "Failed to check active QR");
  }
});




// Validate QR Code (one-time use)
router.get('/validate/:token', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { token } = req.params;
    const { page } = req.query;
    
    if (!token || !page || !visaId) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Token, page and visaId are required");
    }

    // Atomic find and update to mark as used
    const qrCode = await QRCodeModel.findOneAndUpdate(
      { 
        token,
        page,
        visaId, // Add this to be specific
        status: QRCodeModel.QRStatus.ACTIVE,
        expiresAt: { $gt: new Date() }
      },
      { 
        $set: { 
          status: QRCodeModel.QRStatus.USED,
          usedAt: new Date()
        } 
      },
      { 
        new: true,
        session 
      }
    );
    
    if (!qrCode) {
      await session.abortTransaction();
      return errorResponse(res, 410, "QR code not valid or already used");
    }
    
    await session.commitTransaction();
    
    res.json({ 
      success: true,
      valid: true,
      visaId: qrCode.visaId,
      page: qrCode.page
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Validation Error:", error);
    errorResponse(res, 500, "QR validation failed");
  } finally {
    session.endSession();
  }
});

// Check QR Status
router.get('/status/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { page } = req.query;
    
    if (!token || !page) {
      return errorResponse(res, 400, "Token and page are required");
    }

    const qrCode = await QRCodeModel.findOne({
      token,
      page
    });

    if (!qrCode) {
      return errorResponse(res, 404, "QR code not found");
    }

    res.json({
      success: true,
      status: qrCode.status,
      valid: qrCode.status === QRCodeModel.QRStatus.ACTIVE && qrCode.expiresAt > new Date(),
      expiresAt: qrCode.expiresAt,
      visaId: qrCode.visaId
    });

  } catch (error) {
    console.error("Status Check Error:", error);
    errorResponse(res, 500, "Failed to check QR status");
  }
});

// Cleanup expired/invalidated codes
router.post('/cleanup', async (req, res) => {
  try {
    const result = await QRCodeModel.deleteMany({ 
      $or: [
        { status: { $in: [QRCodeModel.QRStatus.USED, QRCodeModel.QRStatus.INVALIDATED] } },
        { expiresAt: { $lt: new Date() } }
      ]
    });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Cleanup Error:", error);
    errorResponse(res, 500, "Cleanup failed");
  }
});

module.exports = router;