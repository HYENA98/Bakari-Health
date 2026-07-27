// utils/payfast.js
const crypto = require('crypto');

/**
 * URL encode exactly like PHP's urlencode()
 * - Spaces become '+'
 * - Percent encoding in uppercase
 */
function urlencode(str) {
    return encodeURIComponent(str)
        .replace(/%20/g, '+')
        .replace(/[!'()*]/g, function(c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });
}

/**
 * Generate Payfast signature (official algorithm)
 * @param {Object} data - Key-value pairs (must be in correct order)
 * @param {string} passphrase - Optional passphrase
 * @returns {string} MD5 signature
 */
function generateSignature(data, passphrase) {
    // 1. Build parameter string in the EXACT order of fields
    let pfOutput = '';
    for (const key in data) {
        const val = data[key];
        if (val !== '' && val !== null && val !== undefined) {
            pfOutput += key + '=' + urlencode(val) + '&';
        }
    }
    // Remove trailing '&'
    pfOutput = pfOutput.slice(0, -1);

    // 2. Append passphrase if provided
    if (passphrase && passphrase.length > 0) {
        pfOutput += '&passphrase=' + urlencode(passphrase);
    }

    // 3. MD5 hash (lowercase)
    return crypto.createHash('md5').update(pfOutput).digest('hex');
}

/**
 * Build Payfast payment data with correct field order
 */
function buildPayfastData(booking, returnUrl, cancelUrl, notifyUrl) {
    const { customer, service } = booking;

    // IMPORTANT: Order of fields MUST match the order expected by Payfast
    // (as per the HTML form description)
    const data = {
        merchant_id: process.env.PAYFAST_MERCHANT_ID,
        merchant_key: process.env.PAYFAST_MERCHANT_KEY,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: notifyUrl,
        amount: service.depositAmount.toFixed(2),
        item_name: `${service.name} – Deposit`,
        item_description: `50% deposit for ${service.name} IV drip therapy`,
        email_address: customer.email,
        name_first: customer.firstName || 'Customer',
        name_last: customer.lastName || 'Unknown',
        cell: customer.phone || '0821234567',
        m_payment_id: booking._id.toString(),
        custom_str1: booking._id.toString(),
        custom_str2: service.name,
    };

    // Generate signature using the official algorithm
    const signature = generateSignature(data, process.env.PAYFAST_PASSPHRASE);
    data.signature = signature;

    return data;
}

/**
 * Validate ITN signature (for webhook)
 */
function validateItnSignature(data, passphrase) {
    const receivedSignature = data.signature;
    // Remove signature before generating
    const dataCopy = { ...data };
    delete dataCopy.signature;
    const calculatedSignature = generateSignature(dataCopy, passphrase);
    return receivedSignature === calculatedSignature;
}

module.exports = {
    urlencode,
    generateSignature,
    buildPayfastData,
    validateItnSignature,
};