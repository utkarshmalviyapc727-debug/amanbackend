const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Order = require('./models/Order');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://unibite:unibite@unibitecluster.9ryhazb.mongodb.net/unibite_db?retryWrites=true&w=majority&appName=UniBiteCluster';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected to unibite_db'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- USER ROUTES ---
app.post('/api/users/sync', async (req, res) => {
    const { firebaseUid, email } = req.body;
    try {
        let user = await User.findOneAndUpdate(
            { firebaseUid },
            { email },
            { upsert: true, new: true }
        );
        res.status(200).json({ message: 'User synced', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ORDER ROUTES ---

// Create a new order
app.post('/api/orders', async (req, res) => {
    try {
        const { firebaseUid, items, totalPrice, userInfo } = req.body;
        const newOrder = new Order({
            firebaseUid,
            items,
            totalPrice,
            userInfo
        });
        await newOrder.save();
        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order history for a user (Sorted by newest first)
app.get('/api/orders/:firebaseUid', async (req, res) => {
    try {
        const orders = await Order.find({ firebaseUid: req.params.firebaseUid })
                                  .sort({ createdAt: -1 }); // Recent on top
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('UniBite Backend is Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
