// services/payfastService.js
const axios = require('axios');
const crypto = require('crypto');

class PayfastService {
    constructor() {
        this.merchantId = process.env.PAYFAST_MERCHANT_ID;
        this.merchantKey = process.env.PAYFAST_MERCHANT_KEY;
        this.passphrase = process.env.PAYFAST_PASSPHRASE;
        this.sandbox = process.env.PAYFAST_SANDBOX === 'true';
        this.apiUrl = this.sandbox 
            ? 'https://sandbox.payfast.co.za/eng/process'
            : 'https://www.payfast.co.za/eng/process';
    }

    /**
     * URL encode exactly like PHP's urlencode()
     * - Spaces become '+'
     * - Percent encoding in uppercase
     */
    urlencode(str) {
        return encodeURIComponent(str)
            .replace(/%20/g, '+')
            .replace(/[!'()*]/g, function(c) {
                return '%' + c.charCodeAt(0).toString(16).toUpperCase();
            });
    }

    /**
     * Generate Payfast signature (OFFICIAL ALGORITHM)
     * 
     * IMPORTANT: 
     * - Fields MUST be in the order they appear (NOT alphabetical)
     * - URL encoding with uppercase percent (%2F not %2f)
     * - Spaces encoded as '+'
     */
    generateSignature(data) {
        // 1. Build parameter string in the EXACT order of fields
        let pfOutput = '';
        for (const key in data) {
            const val = data[key];
            if (val !== '' && val !== null && val !== undefined) {
                pfOutput += key + '=' + this.urlencode(val) + '&';
            }
        }
        // Remove trailing '&'
        pfOutput = pfOutput.slice(0, -1);

        // 2. Append passphrase if provided
        if (this.passphrase && this.passphrase.length > 0) {
            pfOutput += '&passphrase=' + this.urlencode(this.passphrase);
        }

        console.log('📝 String to sign:', pfOutput);

        // 3. MD5 hash (lowercase)
        const signature = crypto.createHash('md5').update(pfOutput).digest('hex');
        console.log('🔑 Generated signature:', signature);

        return signature;
    }

    /**
     * Create payment data
     */
    buildPaymentData(booking, returnUrl, cancelUrl, notifyUrl) {
        const { customer, service } = booking;

        // IMPORTANT: Order of fields MUST match the order expected by Payfast
        // (as per the HTML form description)
        const data = {
            merchant_id: this.merchantId,
            merchant_key: this.merchantKey,
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

        // Add signature using the official algorithm
        data.signature = this.generateSignature(data);

        return data;
    }

    /**
     * Send payment request to Payfast
     */
    async initiatePayment(booking, returnUrl, cancelUrl, notifyUrl) {
        try {
            const paymentData = this.buildPaymentData(booking, returnUrl, cancelUrl, notifyUrl);
            
            console.log('📦 Payment Data:', paymentData);

            return {
                success: true,
                paymentUrl: this.apiUrl,
                paymentData: paymentData,
            };
        } catch (error) {
            console.error('❌ Payment initiation error:', error);
            throw error;
        }
    }

    /**
     * Verify webhook signature (OFFICIAL ALGORITHM)
     */
    verifyWebhook(data) {
        const receivedSignature = data.signature;
        // Remove signature before generating
        const dataCopy = { ...data };
        delete dataCopy.signature;
        const calculatedSignature = this.generateSignature(dataCopy);
        
        console.log('🔍 Received signature:', receivedSignature);
        console.log('🔍 Calculated signature:', calculatedSignature);
        
        return receivedSignature === calculatedSignature;
    }
}

module.exports = new PayfastService();