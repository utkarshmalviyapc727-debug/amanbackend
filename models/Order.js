const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true },
    items: [{
        name: String,
        price: Number,
        quantity: Number,
        image: String
    }],
    totalPrice: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    userInfo: {
        name: String,
        address: String,
        phone: String
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
