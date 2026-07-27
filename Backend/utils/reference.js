// utils/reference.js

/**
 * Generate a short, unique reference number
 * Format: BK + 6 alphanumeric characters
 * Example: BK6A7B9C
 *
 * This gives 36^6 = 2,176,782,336 possible combinations
 */
function generateShortReference() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BK';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = {
    generateShortReference,
};