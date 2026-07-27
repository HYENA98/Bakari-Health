// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        // ========================================
        // REFERENCE - Short unique identifier
        // ========================================
        reference: {
            type: String,
            unique: true,
            default: '',
        },

        // ========================================
        // CUSTOMER INFORMATION
        // ========================================
        customer: {
            firstName: {
                type: String,
                required: [true, 'First name is required'],
                trim: true,
            },
            lastName: {
                type: String,
                trim: true,
                default: '',
            },
            email: {
                type: String,
                required: [true, 'Email is required'],
                lowercase: true,
                trim: true,
                match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
            },
            phone: {
                type: String,
                required: [true, 'Phone number is required'],
                trim: true,
            },
            address: {
                type: String,
                required: [true, 'Service address is required'],
                trim: true,
            },
        },

        // ========================================
        // SERVICE DETAILS
        // ========================================
        service: {
            name: {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            depositAmount: {
                type: Number,
                required: true,
            },
        },

        // ========================================
        // APPOINTMENT DETAILS
        // ========================================
        appointment: {
            date: {
                type: Date,
                required: true,
            },
            time: {
                type: String,
                required: true,
            },
            status: {
                type: String,
                enum: ['pending', 'confirmed', 'completed', 'cancelled'],
                default: 'pending',
            },
        },

        // ========================================
        // SPECIAL REQUESTS
        // ========================================
        specialRequests: {
            type: String,
            trim: true,
            default: '',
        },

        // ========================================
        // PAYMENT INFORMATION
        // ========================================
        payment: {
            status: {
                type: String,
                enum: ['pending', 'paid', 'failed', 'refunded'],
                default: 'pending',
            },
            method: {
                type: String,
                enum: ['payfast', 'ozow', 'yoco', 'cash', 'pending'],
                default: 'pending',
            },
            depositPaid: {
                type: Boolean,
                default: false,
            },
            paymentId: {
                type: String,
                default: '',
            },
            amountPaid: {
                type: Number,
                default: 0,
            },
            paidAt: {
                type: Date,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
bookingSchema.index({ 'customer.email': 1 });
bookingSchema.index({ 'appointment.date': 1 });
bookingSchema.index({ 'payment.status': 1 });

module.exports = mongoose.model('Booking', bookingSchema);