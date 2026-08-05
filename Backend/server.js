// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Booking = require('./models/Booking');
const { sendBookingConfirmation, sendAdminNotification } = require('./utils/email');
const { generateShortReference } = require('./utils/reference');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const app = express();

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors({
    origin: ['http://localhost:3001',
             'http://127.0.0.1:3001',
             'https://bakari-health-frontend.onrender.com',
             'https://bakari-health.onrender.com',
             'https://www.bakari-health.co.za',
             'https://bakari-health.co.za'
            ],
    credentials: true,
}));
app.use(express.json());

// ========================================
// CONNECT TO MONGODB
// ========================================

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully!');
        console.log('📡 Database:', mongoose.connection.name);
        console.log('📡 Host:', mongoose.connection.host);
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
    });

// ========================================
// ROUTES
// ========================================

// Health check
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.json({
        status: 'ok',
        service: 'Bakari-Health API',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

// ========================================
// BOOKING ROUTES
// ========================================

// Create a booking
app.post('/api/bookings', async (req, res) => {
    try {
        console.log('📨 Received booking data:', req.body);

        const bookingData = req.body;

        // Generate short reference
        bookingData.reference = generateShortReference();

        const booking = new Booking(bookingData);
        await booking.save();

        console.log(`✅ Booking saved: ${booking.reference} (${booking._id})`);

        // Send confirmation to customer
        await sendBookingConfirmation(booking);

        // Send notification to admin
        await sendAdminNotification(booking);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking,
        });
    } catch (error) {
        console.error('❌ Error creating booking:', error);

        // Check for duplicate reference (rare but possible)
        if (error.code === 11000 && error.keyPattern && error.keyPattern.reference) {
            // Retry with new reference
            try {
                const bookingData = req.body;
                bookingData.reference = generateShortReference();
                const booking = new Booking(bookingData);
                await booking.save();
                console.log(`✅ Booking saved (retry): ${booking.reference}`);

                // Send emails
                await sendBookingConfirmation(booking);
                await sendAdminNotification(booking);

                return res.status(201).json({
                    success: true,
                    message: 'Booking created successfully',
                    data: booking,
                });
            } catch (retryError) {
                console.error('❌ Retry failed:', retryError);
                return res.status(500).json({
                    success: false,
                    message: 'Error creating booking after retry',
                    error: retryError.message,
                });
            }
        }

        res.status(400).json({
            success: false,
            message: 'Error creating booking',
            error: error.message,
        });
    }
});

// Get all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find()
            .sort({ createdAt: -1 })
            .select('-__v');

        res.json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (error) {
        console.error('❌ Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message,
        });
    }
});

// Get a single booking by ID
app.get('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).select('-__v');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        res.json({
            success: true,
            data: booking,
        });
    } catch (error) {
        console.error('❌ Error fetching booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message,
        });
    }
});

// Get booking by reference
app.get('/api/bookings/reference/:ref', async (req, res) => {
    try {
        const booking = await Booking.findOne({ reference: req.params.ref }).select('-__v');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        res.json({
            success: true,
            data: booking,
        });
    } catch (error) {
        console.error('❌ Error fetching booking by reference:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message,
        });
    }
});

// Update booking status
app.put('/api/bookings/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value. Must be one of: ' + validStatuses.join(', '),
            });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        booking.appointment.status = status;
        await booking.save();

        res.json({
            success: true,
            message: `Booking status updated to ${status}`,
            data: booking,
        });
    } catch (error) {
        console.error('❌ Error updating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking',
            error: error.message,
        });
    }
});

// Delete a booking
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        res.json({
            success: true,
            message: `Booking ${booking.reference || booking._id} deleted successfully`,
        });
    } catch (error) {
        console.error('❌ Error deleting booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting booking',
            error: error.message,
        });
    }
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`📡 Bookings API: http://localhost:${PORT}/api/bookings`);
    console.log(`🔧 Mode: ${process.env.NODE_ENV || 'development'}`);
});