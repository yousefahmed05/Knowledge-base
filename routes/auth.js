const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateAdminFallback } = require('../utils/authFallback');

// GET /register - Show registration form
router.get('/register', (req, res) => {
    res.render('auth/register');
});

// POST /register - Handle registration
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).render('auth/register', { 
                error: 'Email is already registered' 
            });
        }

        // Create new user with default role 'user'
        const user = new User({
            email,
            password,
            role: 'user'
        });

        await user.save();
        res.status(201).redirect('/login');
    } catch (err) {
        console.error('Registration error:', err);
        res.status(400).render('auth/register', { 
            error: 'Registration failed. Please try again.' 
        });
    }
});

// GET /login - Show login form
router.get('/login', (req, res) => {
    res.render('auth/login');
});

// POST /login - Handle login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const fallbackUser = authenticateAdminFallback(email, password);
        if (fallbackUser) {
            const token = jwt.sign(
                { id: fallbackUser.id, role: fallbackUser.role },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.cookie('jwt', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000
            });

            console.log(`✅ Fallback admin login accepted for ${fallbackUser.email}`);
            return res.redirect('/');
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).render('auth/login', { 
                error: 'Invalid email or password' 
            });
        }

        // Compare passwords
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).render('auth/login', { 
                error: 'Invalid email or password' 
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set httpOnly cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: false, // Always false for localhost (not using HTTPS)
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        
        console.log(`✅ JWT token set for user ${user.email} (role: ${user.role})`);

        res.redirect('/');
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).render('auth/login', { 
            error: 'Login failed. Please try again.' 
        });
    }
});

// GET /logout - Clear cookie and redirect
router.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/login');
});

module.exports = router;
