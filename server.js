require('dotenv').config();
const path = require('path');
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Import routes and middleware
const pageRoutes = require('./routes/pages');
const authRoutes = require('./middleware/auth');
const adminRoutes = require('./routes/admin');
const { requireAuth, requireAdmin } = require('./middleware/auth');

// ============= DATABASE CONNECTION =============
async function connectDB() {
    try {
        const connectionString = process.env.MONGODB_URI || 'mongodb+srv://SeifHassan:seifhassan17@crm.bagyzhs.mongodb.net/Database';
        const originalServers = dns.getServers();
        dns.setServers(['8.8.8.8', '8.8.4.4']);
        
        await mongoose.connect(connectionString);
        console.log('✅ MongoDB connected');
        }
    catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
}

// ============= MIDDLEWARE =============
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.locals.siteName = 'GlobalTours';
app.locals.currentYear = new Date().getFullYear();

const { stripHtml, isRichHtml, parseArticleDetails, getArticleBody } = require('./utils/articleDetails');
app.locals.stripHtml = stripHtml;
app.locals.isRichHtml = isRichHtml;
app.locals.parseArticleDetails = parseArticleDetails;
app.locals.getArticleBody = getArticleBody;

const { ensureDefaultAdmin } = require('./utils/adminSeed');

// ============= ROUTES =============

// Public Routes
app.use('/', authRoutes);

// Admin Routes
app.use('/', adminRoutes);

// Legacy dashboard route - redirects to home
app.get('/dashboard', requireAuth, (req, res) => {
    res.redirect('/');
});

// Admin-only Route Example
app.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const User = require('./models/User');
        const users = await User.find().select('email role createdAt');
        res.render('admin/users', { users, user: req.user });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Error fetching users');
    }
});

// Regular page routes
app.use('/', pageRoutes);

// ============= START SERVER =============
async function startServer() {
    await connectDB();

    const User = require('./models/User');
    try {
        const result = await ensureDefaultAdmin(User);
        if (result.created) {
            console.log(`🛡️ Seeded default admin account: ${result.user.email}`);
        } else {
            console.log(`🛡️ Admin account ready: ${result.user.email}`);
        }
    } catch (err) {
        console.error('⚠️ Failed to ensure admin account:', err.message);
    }
    
    app.listen(PORT, () => {
        console.log(`🚀 Server is flying high at http://localhost:${PORT}`);
    });
}

if (require.main === module) {
    startServer().catch(err => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
}

module.exports = app;