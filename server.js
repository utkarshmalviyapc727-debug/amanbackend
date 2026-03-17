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

// Update User Profile (Added upsert: true to prevent 404)
app.post('/api/users/update', async (req, res) => {
    const { firebaseUid, name, dob, studentUid, contact } = req.body;
    try {
        let user = await User.findOneAndUpdate(
            { firebaseUid },
            { name, dob, studentUid, contact },
            { upsert: true, new: true }
        );
        res.status(200).json({ message: 'Profile updated', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:firebaseUid', async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ORDER ROUTES ---

// Create a new order
app.post('/api/orders', async (req, res) => {
    try {
        const { firebaseUid, items, totalPrice, userInfo } = req.body;

        // Check if user is banned
        const user = await User.findOne({ firebaseUid });
        if (user && user.banUntil && user.banUntil > new Date()) {
            return res.status(403).json({
                error: 'You are banned from ordering until ' + user.banUntil.toLocaleDateString()
            });
        }

        const newOrder = new Order({
            firebaseUid,
            items,
            totalPrice,
            userInfo
        });
        await newOrder.save();

        // Auto-complete order after 30 minutes (simulating delivery)
        setTimeout(async () => {
            try {
                await Order.findByIdAndUpdate(newOrder._id, { status: 'Delivered' });
                console.log(`Order ${newOrder._id} auto-delivered.`);
            } catch (err) {
                console.error("Auto-delivery failed:", err);
            }
        }, 30 * 60 * 1000);

        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders/status', async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const oldStatus = order.status;
        order.status = status;
        await order.save();

        // Ban logic: if status changed to Cancelled
        if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const cancelledToday = await Order.countDocuments({
                firebaseUid: order.firebaseUid,
                status: 'Cancelled',
                createdAt: { $gte: startOfDay }
            });

            if (cancelledToday > 3) {
                const banDate = new Date();
                banDate.setDate(banDate.getDate() + 7);
                await User.findOneAndUpdate(
                    { firebaseUid: order.firebaseUid },
                    { banUntil: banDate }
                );
            }
        }

        res.status(200).json({ message: 'Status updated', order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order history for a user
app.get('/api/orders/:firebaseUid', async (req, res) => {
    try {
        const orders = await Order.find({ firebaseUid: req.params.firebaseUid })
                                  .sort({ createdAt: -1 });
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
