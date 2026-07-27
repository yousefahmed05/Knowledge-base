require('dotenv').config();
const path = require('path');
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 3000;

// Import routes and middleware
const pageRoutes = require('./routes/pages');
const authRoutes = require('./middleware/auth');
const adminRoutes = require('./routes/admin');
const { requireAuth, requireAdmin } = require('./middleware/auth');

// ============= DATABASE CONNECTION & INITIALIZATION =============
let connectionPromise = null;

function connectDB() {
    if (connectionPromise) return connectionPromise;

    connectionPromise = (async () => {
        try {
            const connectionString = process.env.MONGODB_URI || 'mongodb+srv://SeifHassan:seifhassan17@crm.bagyzhs.mongodb.net/Database';
            try {
                dns.setServers(['8.8.8.8', '8.8.4.4']);
            } catch(e) {}
            
            await mongoose.connect(connectionString, {
                serverSelectionTimeoutMS: 5000 // Fail faster if unable to connect
            });
            console.log('✅ MongoDB connected');
            
            const User = require('./models/User');
            const { ensureDefaultAdmin } = require('./utils/adminSeed');
            const result = await ensureDefaultAdmin(User);
            if (result.created) {
                console.log(`🛡️ Seeded default admin account: ${result.user.email}`);
            } else {
                console.log(`🛡️ Admin account ready: ${result.user.email}`);
            }
        } catch (err) {
            console.error('❌ MongoDB connection error:', err.message);
            console.warn('MongoDB not connected — some features may not work');
            connectionPromise = null; // Allow retrying on failure
        }
    })();

    return connectionPromise;
}

// Ensure database connection is initialized for serverless environments (Vercel)
connectDB();

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

app.use((err, req, res, next) => {
  if (err.name === 'MongooseError' || err.name === 'MongoNetworkError' || (err.message && err.message.includes('buffering timed out'))) {
    console.warn('[AI Studio] Database offline — returning mock empty response');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
  }
  next(err);
});

// ============= START SERVER =============
async function startServer() {
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
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