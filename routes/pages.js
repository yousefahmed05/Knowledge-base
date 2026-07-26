const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Service = require('../models/Service');
const News = require('../models/News');

// 🏠 Home Page Route (Protected)
router.get('/', requireAuth, async (req, res) => {
    try {
        const [destinations, newsItems] = await Promise.all([
            Service.find()
                .populate('category')
                .sort({ updatedAt: -1, createdAt: -1 })
                .limit(5),
            News.find({ active: true }).sort({ order: 1, createdAt: -1 })
        ]);

        res.render('index', {
            title: 'Home | GlobalTours',
            destinations,
            newsItems,
            user: req.user,
            activePage: 'home'
        });
    } catch (err) {
        console.error('Error fetching home destinations:', err);
        res.status(500).send('Error loading home page');
    }
});

// News detail page (visible to all authenticated users)
router.get('/news/:id', requireAuth, async (req, res) => {
    try {
        const newsItem = await News.findById(req.params.id);
        if (!newsItem || !newsItem.active) {
            return res.status(404).send('News not found');
        }

        res.render('news-detail', {
            title: `${newsItem.title} | GlobalTours`,
            newsItem,
            user: req.user,
            activePage: 'home'
        });
    } catch (err) {
        console.error('Error fetching news details:', err);
        res.status(500).send('Error loading news');
    }
});

// Service Requests Route (Protected) - Fetch from database
router.get('/serviceReq', requireAuth, async (req, res) => {
    try {
        const services = await Service.find()
            .populate('category')
            .sort({ order: 1, createdAt: -1 });
        res.render('serviceReq', {
            title: 'Knowledge Base | GlobalTours',
            services,
            user: req.user,
            activePage: 'knowledge-base'
        });
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).send('Error fetching services');
    }
});

// Article detail route (Protected)
router.get('/serviceReq/:slug', requireAuth, async (req, res) => {
    try {
        const service = await Service.findOne({ slug: req.params.slug }).populate('category');

        if (!service) {
            return res.status(404).send('Article not found');
        }

        res.render('article-detail', {
            title: `${service.name} | GlobalTours`,
            service,
            user: req.user,
            activePage: 'knowledge-base'
        });
    } catch (err) {
        console.error('Error fetching article details:', err);
        res.status(500).send('Error loading article');
    }
});

// Export the router module so server.js can see it
module.exports = router;