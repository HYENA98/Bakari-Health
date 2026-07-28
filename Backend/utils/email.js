// utils/email.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send booking confirmation email to customer
 */
async function sendBookingConfirmation(booking) {
    const { customer, service, appointment, reference } = booking;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'bakari.health@icloud.com',
        to: customer.email,
        subject: `✅ Booking Confirmed – Bakari-Health`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 8px; }
                    .header { text-align: center; border-bottom: 2px solid #b8860b; padding-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; color: #1a1a2e; }
                    .logo span { color: #b8860b; }
                    .tagline { color: #b8860b; font-size: 14px; }
                    .content { padding: 20px 0; }
                    .details { background: #f8f6f4; padding: 16px; border-radius: 8px; margin: 16px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .detail-row:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #555; }
                    .value { color: #1a1a2e; }
                    .payment-box { background: #f0f4f8; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #b8860b; }
                    .btn { display: inline-block; background: #b8860b; color: #fff; padding: 10px 24px; border-radius: 4px; text-decoration: none; }
                    .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e8e8e8; font-size: 12px; color: #888; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">Bakari-<span>Health</span></div>
                        <div class="tagline">Optimistic About Health. Optimistic About You.</div>
                    </div>

                    <div class="content">
                        <h2>Booking Confirmed! 🎉</h2>

                        <p>Dear <strong>${customer.firstName} ${customer.lastName}</strong>,</p>

                        <p>Your IV drip session has been <strong>confirmed</strong>. Here are your booking details:</p>

                        <div class="details">
                            <div class="detail-row">
                                <span class="label">Booking Reference</span>
                                <span class="value"><strong>${reference || booking._id}</strong></span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Service</span>
                                <span class="value"><strong>${service.name}</strong></span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Date</span>
                                <span class="value">${new Date(appointment.date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Time</span>
                                <span class="value">${appointment.time}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Location</span>
                                <span class="value">${customer.address}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Deposit Due</span>
                                <span class="value"><strong>R${service.depositAmount.toFixed(2)}</strong></span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Balance Due (after service)</span>
                                <span class="value"><strong>R${(service.price - service.depositAmount).toFixed(2)}</strong></span>
                            </div>
                        </div>

                        <div class="payment-box">
                            <p><strong>💳 Payment Instructions</strong></p>
                            <p>To secure your booking, please pay the deposit to:</p>
                            <p>
                                <strong>Bank:</strong> FNB BUSINESS ACOUNT<br />
                                <strong>Account Holder:</strong> Bakari-Health pty ltd<br />
                                <strong>Account Number:</strong> 63208192540<br />
                                <strong>Reference:</strong> <span style="font-weight: bold; color: #b8860b;">${reference || booking._id}</span>
                            </p>
                            <p style="font-size: 0.85rem; color: #888;">
                                ⚠️ Please use the reference above when making payment.
                            </p>
                        </div>

                        <h3>What happens next?</h3>
                        <ul>
                            <li>📞 A licensed nurse will contact you within <strong>24 hours</strong></li>
                            <li>📹 You'll have a quick video consultation <strong>48 hours</strong> before your session</li>
                            <li>💳 The remaining balance is payable <strong>after the service</strong></li>
                        </ul>

                        <div style="text-align: center; margin: 24px 0;">
                            <a href="https://www.bakari-health.co.za" class="btn">Visit Our Website</a>
                        </div>

                        <p style="font-size: 14px; color: #666;">
                            If you have any questions, simply reply to this email or call us at <strong>071 659 5529</strong>.
                        </p>
                    </div>

                    <div class="footer">
                        <p>© 2026 Bakari-Health SA. All rights reserved.</p>
                        <p>Optimistic About Health. Optimistic About You.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Confirmation email sent to ${customer.email}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Email error for ${customer.email}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send admin notification email
 */
async function sendAdminNotification(booking) {
    const { customer, service, appointment, reference } = booking;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@bakari-health.co.za',
        to: process.env.ADMIN_EMAIL || 'admin@bakari-health.co.za',
        subject: `📋 New Booking – ${customer.firstName} ${customer.lastName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>📋 New Booking Received!</h2>

                <div style="background: #f8f6f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Booking Reference:</strong> ${reference || booking._id}</p>
                    <p><strong>Customer:</strong> ${customer.firstName} ${customer.lastName}</p>
                    <p><strong>Email:</strong> ${customer.email}</p>
                    <p><strong>Phone:</strong> ${customer.phone}</p>
                    <p><strong>Service:</strong> ${service.name}</p>
                    <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${appointment.time}</p>
                    <p><strong>Address:</strong> ${customer.address}</p>
                    <p><strong>Special Requests:</strong> ${booking.specialRequests || 'None'}</p>
                    <p><strong>Booking ID:</strong> ${booking._id}</p>
                </div>

                <a href="http://localhost:3000/admin.html" style="background: #1a1a2e; color: #fff; padding: 10px 20px; border-radius: 4px; text-decoration: none;">
                    View in Dashboard
                </a>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Admin notification sent`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Admin email error:`, error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendBookingConfirmation,
    sendAdminNotification,
};