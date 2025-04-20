const mongoose = require("mongoose");

const QRStatus = {
  ACTIVE: 'active',
  USED: 'used',
  EXPIRED: 'expired',
  INVALIDATED: 'invalidated'
};

const QrSchema = new mongoose.Schema({
  token: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  visaId: { 
    type: String, 
    required: true,
    index: true
  },
  page: { 
    type: String, 
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(QRStatus),
    default: QRStatus.ACTIVE,
    index: true
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  usedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for faster lookups
QrSchema.index({ visaId: 1, page: 1, status: 1 });

// Pre-save hook to ensure uniqueness per active visaId+page
QrSchema.pre('save', async function(next) {
  if (this.isNew && this.status === QRStatus.ACTIVE) {
    const existing = await mongoose.model('QRCode').findOne({
      visaId: this.visaId,
      page: this.page,
      status: QRStatus.ACTIVE
    });
    if (existing) {
      throw new Error('Active QR code already exists for this visaId+page');
    }
  }
  next();
});

module.exports = mongoose.model("QRCode", QrSchema);
module.exports.QRStatus = QRStatus;
