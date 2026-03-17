const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, default: "" },
    dob: { type: String, default: "" },
    studentUid: { type: String, default: "" },
    contact: { type: String, default: "" },
    banUntil: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
