// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Booking = require('./models/Booking');
const { sendBookingConfirmation, sendAdminNotification } = require('./utils/email');
const { generateShortReference } = require('./utils/reference');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const app = express();

// ========================================
// RATE LIMITING (Security)
// ========================================

// Global rate limiter - prevents DoS attacks
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limiter for booking endpoints
const bookingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 booking requests per minute
    message: {
        success: false,
        message: 'Too many booking attempts. Please wait a moment before trying again.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply global rate limiter to all routes
app.use(globalLimiter);

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors({
    origin: [
        'http://localhost:3001',
        'http://127.0.0.1:3001',
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
// HELPER: Input Validation
// ========================================

const validateBookingInput = (data) => {
    const { customer, service, appointment } = data;

    // Validate required fields
    if (!customer || !service || !appointment) {
        return { valid: false, message: 'Missing required fields' };
    }

    // Validate email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!customer.email || !emailRegex.test(customer.email)) {
        return { valid: false, message: 'Invalid email address' };
    }

    // Validate phone (South African number format)
    const phoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
    if (!customer.phone || !phoneRegex.test(customer.phone.replace(/\s/g, ''))) {
        return { valid: false, message: 'Invalid phone number. Please use a valid South African number.' };
    }

    // Validate service price
    if (!service.price || service.price <= 0) {
        return { valid: false, message: 'Invalid service price' };
    }

    // Validate appointment date
    if (!appointment.date || new Date(appointment.date) < new Date()) {
        return { valid: false, message: 'Invalid appointment date' };
    }

    // Sanitize inputs (prevent XSS)
    const sanitize = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/[<>]/g, '').trim();
    };

    customer.firstName = sanitize(customer.firstName);
    customer.lastName = sanitize(customer.lastName);
    customer.address = sanitize(customer.address);
    if (data.specialRequests) {
        data.specialRequests = sanitize(data.specialRequests);
    }

    return { valid: true, data };
};

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
// BOOKING ROUTES (with rate limiting)
// ========================================

// Create a booking
app.post('/api/bookings', bookingLimiter, async (req, res) => {
    try {
        console.log('📨 Received booking data:', req.body);

        // ========================================
        // VALIDATE INPUT
        // ========================================

        const validation = validateBookingInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message,
                error: 'Validation failed'
            });
        }

        const bookingData = validation.data;

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

        // Send appropriate error response (don't expose internal errors)
        res.status(400).json({
            success: false,
            message: error.message || 'Error creating booking',
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
        });
    }
});

// ========================================
// ERROR HANDLING (Prevents stack trace leaks)
// ========================================

app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);

    // Don't expose stack traces in production
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
        success: false,
        message: 'Something went wrong',
        ...(isProduction ? {} : { error: err.message, stack: err.stack })
    });
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
    console.log(`🔒 Rate limiting enabled: 100 requests/15min, 10 bookings/min`);
});