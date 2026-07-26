require('dotenv').config();
const mongoose = require('mongoose');
const News = require('./models/News');

// Strip HTML tags from content
function stripHtmlTags(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://SeifHassan:seifhassan17@crm.bagyzhs.mongodb.net/Database')
  .then(() => {
    console.log('Connected to MongoDB');
    fixNewsContent();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fixNewsContent() {
  try {
    // Define the news items to fix
    const itemsToFix = [
      '6a649f549b4109e2f06bc82e', // "z" news item
      '6a649f359b4109e2f06bc82d'  // "sfnionsg" news item
    ];

    for (const id of itemsToFix) {
      const newsItem = await News.findById(id);
      if (newsItem) {
        console.log(`Fixing news item: ${newsItem.title}`);
        console.log(`Old content: ${newsItem.content}`);
        
        // Strip all HTML tags from content
        newsItem.content = stripHtmlTags(newsItem.content);
        await newsItem.save();
        
        console.log(`Fixed news item: ${newsItem.title}`);
        console.log(`New content: ${newsItem.content}\n`);
      }
    }

    console.log('All news items fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing news content:', err);
    process.exit(1);
  }
}
