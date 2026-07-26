const jwt = require('jsonwebtoken');

// Middleware to verify JWT and attach user to request
const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    
    if (!token) {
        console.log(`🔑 No JWT token found in cookie, redirecting to login`);
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(`✅ JWT verified for user ${decoded.id}`);
        next();
    } catch (err) {
        console.error('❌ JWT verification error:', err.message);
        res.clearCookie('jwt');
        return res.redirect('/login');
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    console.log(`🔐 Admin check: user role = '${req.user.role}'`);
    if (req.user.role !== 'admin') {
        console.log(`❌ Access denied: User ${req.user.id} is not an admin`);
        return res.status(403).render('notAuthorized');
    }
    console.log(`✅ Admin access granted for user ${req.user.id}`);
    next();
};

module.exports = { requireAuth, requireAdmin };
