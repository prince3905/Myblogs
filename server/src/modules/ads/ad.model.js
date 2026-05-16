const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  slot: { type: String, unique: true, required: true },
  code: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Ad', adSchema);
