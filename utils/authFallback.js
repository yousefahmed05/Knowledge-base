const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'seif1234';

function authenticateAdminFallback(email, password) {
    if (!email || !password) {
        return null;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (normalizedEmail === DEFAULT_ADMIN_EMAIL && String(password) === DEFAULT_ADMIN_PASSWORD) {
        return {
            id: 'fallback-admin',
            email: DEFAULT_ADMIN_EMAIL,
            role: 'admin'
        };
    }

    return null;
}

module.exports = {
    DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD,
    authenticateAdminFallback
};
