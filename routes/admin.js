const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const Service = require('../models/Service');
const News = require('../models/News');
const { stripHtml } = require('../utils/articleDetails');
const { toDataUrl } = require('../utils/newsImageStorage');

// Helper function to generate slug
function generateSlug(text) {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+\$/g, '');
}

const newsUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'news');
if (!fs.existsSync(newsUploadDir)) {
    fs.mkdirSync(newsUploadDir, { recursive: true });
}

const newsStorage = multer.memoryStorage();

const newsUpload = multer({
    storage: newsStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'));
        }
    }
});

function deleteNewsImage(imageUrl) {
    if (!imageUrl || !imageUrl.startsWith('/uploads/news/')) return;
    const filePath = path.join(__dirname, '..', 'public', imageUrl);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

// GET /admin/services - List all services
router.get('/admin/services', requireAuth, requireAdmin, async (req, res) => {
    try {
        const services = await Service.find()
            .populate('category')
            .sort({ order: 1, createdAt: -1 });
        res.render('admin/services', { services, user: req.user });
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).send('Error fetching services');
    }
});

// GET /admin/services/new - Show create form
router.get('/admin/services/new', requireAuth, requireAdmin, async (req, res) => {
    try {
        res.render('admin/service-form', { service: null, user: req.user });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error loading form');
    }
});

// POST /admin/services - Create new service
router.post('/admin/services', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, categoryId, description, details, detailsLayout, bulkContent, order } = req.body;
        const cleanName = stripHtml(name).trim();

        // Validation
        if (!cleanName) {
            return res.status(400).send('Name is required');
        }

        const slug = generateSlug(cleanName);
        
        // Check if slug already exists
        const existingService = await Service.findOne({ slug });
        if (existingService) {
            return res.status(400).send('A service with this name already exists');
        }

        const layout = ['bulk', 'steps', 'both'].includes(detailsLayout) ? detailsLayout : 'steps';

        const service = new Service({
            name: cleanName,
            slug,
            description,
            detailsLayout: layout,
            bulkContent: bulkContent || '',
            details: details || '',
            order: parseInt(order) || 0
        });

        await service.save();
        res.redirect('/admin/services');
    } catch (err) {
        console.error('Error creating service:', err);
        res.status(500).send('Error creating service');
    }
});

// GET /admin/services/:id/edit - Show edit form
router.get('/admin/services/:id/edit', requireAuth, requireAdmin, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        
        if (!service) {
            return res.status(404).send('Service not found');
        }
        res.render('admin/service-form', { service, user: req.user });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error loading service');
    }
});

// POST /admin/services/:id/edit - Update service
router.post('/admin/services/:id/edit', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, categoryId, description, details, detailsLayout, bulkContent, order } = req.body;
        const cleanName = stripHtml(name).trim();
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).send('Service not found');
        }

        // Validation
        if (!cleanName) {
            return res.status(400).send('Name is required');
        }

        const slug = generateSlug(cleanName);

        // Check if new slug conflicts with other services
        if (slug !== service.slug) {
            const existingService = await Service.findOne({ slug });
            if (existingService) {
                return res.status(400).send('A service with this name already exists');
            }
        }

        const layout = ['bulk', 'steps', 'both'].includes(detailsLayout) ? detailsLayout : 'steps';

        service.name = cleanName;
        service.slug = slug;
        service.description = description;
        service.detailsLayout = layout;
        service.bulkContent = bulkContent || '';
        service.details = details || '';
        service.order = parseInt(order) || 0;
        service.updatedAt = Date.now();

        await service.save();
        res.redirect('/admin/services');
    } catch (err) {
        console.error('Error updating service:', err);
        res.status(500).send('Error updating service');
    }
});

// POST /admin/services/:id/delete - Delete service
router.post('/admin/services/:id/delete', requireAuth, requireAdmin, async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);

        if (!service) {
            return res.status(404).send('Service not found');
        }

        res.redirect('/admin/services');
    } catch (err) {
        console.error('Error deleting service:', err);
        res.status(500).send('Error deleting service');
    }
});

// ============= NEWS ADMIN CRUD =============

// GET /admin/news - List all news
router.get('/admin/news', requireAuth, requireAdmin, async (req, res) => {
    try {
        const newsItems = await News.find().sort({ order: 1, createdAt: -1 });
        res.render('admin/news', { newsItems, user: req.user });
    } catch (err) {
        console.error('Error fetching news:', err);
        res.status(500).send('Error fetching news');
    }
});

// GET /admin/news/new - Show create form
router.get('/admin/news/new', requireAuth, requireAdmin, (req, res) => {
    res.render('admin/news-form', { newsItem: null, user: req.user });
});

// POST /admin/news - Create news
router.post('/admin/news', requireAuth, requireAdmin, newsUpload.single('image'), async (req, res) => {
    try {
        const { title, content, order, active } = req.body;
        const cleanTitle = stripHtml(title).trim();

        if (!cleanTitle || !content) {
            return res.status(400).send('Title and content are required');
        }
        if (!req.file) {
            return res.status(400).send('An image is required');
        }

        const newsItem = new News({
            title: cleanTitle,
            content,
            imageUrl: toDataUrl(req.file),
            order: parseInt(order, 10) || 0,
            active: active === 'on' || active === 'true' || active === '1'
        });

        await newsItem.save();
        res.redirect('/admin/news');
    } catch (err) {
        console.error('Error creating news:', err);
        res.status(500).send(err.message || 'Error creating news');
    }
});

// POST /admin/news/upload-image - Upload image for TinyMCE editor
router.post('/admin/news/upload-image', requireAuth, requireAdmin, newsUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const location = toDataUrl(req.file);
        res.json({
            location: location
        });
    } catch (err) {
        console.error('Error uploading image:', err);
        res.status(500).json({ error: err.message || 'Error uploading image' });
    }
});

// GET /admin/news/:id/edit - Show edit form
router.get('/admin/news/:id/edit', requireAuth, requireAdmin, async (req, res) => {
    try {
        const newsItem = await News.findById(req.params.id);
        if (!newsItem) {
            return res.status(404).send('News not found');
        }
        res.render('admin/news-form', { newsItem, user: req.user });
    } catch (err) {
        console.error('Error loading news:', err);
        res.status(500).send('Error loading news');
    }
});

// POST /admin/news/:id/edit - Update news
router.post('/admin/news/:id/edit', requireAuth, requireAdmin, newsUpload.single('image'), async (req, res) => {
    try {
        const { title, content, order, active } = req.body;
        const cleanTitle = stripHtml(title).trim();
        const newsItem = await News.findById(req.params.id);

        if (!newsItem) {
            return res.status(404).send('News not found');
        }
        if (!cleanTitle || !content) {
            return res.status(400).send('Title and content are required');
        }

        newsItem.title = cleanTitle;
        newsItem.content = content;
        newsItem.order = parseInt(order, 10) || 0;
        newsItem.active = active === 'on' || active === 'true' || active === '1';
        newsItem.updatedAt = Date.now();

        if (req.file) {
            if (newsItem.imageUrl && newsItem.imageUrl.startsWith('/uploads/news/')) {
                deleteNewsImage(newsItem.imageUrl);
            }
            newsItem.imageUrl = toDataUrl(req.file);
        }

        await newsItem.save();
        res.redirect('/admin/news');
    } catch (err) {
        console.error('Error updating news:', err);
        res.status(500).send(err.message || 'Error updating news');
    }
});

// POST /admin/news/:id/delete - Delete news
router.post('/admin/news/:id/delete', requireAuth, requireAdmin, async (req, res) => {
    try {
        const newsItem = await News.findByIdAndDelete(req.params.id);
        if (!newsItem) {
            return res.status(404).send('News not found');
        }
        deleteNewsImage(newsItem.imageUrl);
        res.redirect('/admin/news');
    } catch (err) {
        console.error('Error deleting news:', err);
        res.status(500).send('Error deleting news');
    }
});

// Cleanup existing news titles (remove HTML) - runs once
router.get('/admin/cleanup-news-titles', requireAuth, requireAdmin, async (req, res) => {
    try {
        const allNews = await News.find({});
        let updated = 0;
        
        for (const newsItem of allNews) {
            const cleanTitle = stripHtml(newsItem.title).trim();
            if (cleanTitle !== newsItem.title) {
                newsItem.title = cleanTitle;
                await newsItem.save();
                updated++;
            }
        }
        
        res.json({ 
            message: `Cleaned up ${updated} news item(s)`,
            updated 
        });
    } catch (err) {
        console.error('Error cleaning up news:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
