require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const dns = require('dns');

// Fix DNS for MongoDB
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function makeUserAdmin(email) {
    try {
        console.log(`🔍 Searching for user: ${email}`);
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.log(`❌ User not found: ${email}`);
            process.exit(1);
        }
        
        console.log(`📋 User found:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Current role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        
        if (user.role === 'admin') {
            console.log(`✅ User is already an admin!`);
            process.exit(0);
        }
        
        user.role = 'admin';
        await user.save();
        
        console.log(`✅ User promoted to admin!`);
        console.log(`   Email: ${user.email}`);
        console.log(`   New role: ${user.role}`);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

async function connectAndRun() {
    try {
        const originalServers = dns.getServers();
        dns.setServers(['8.8.8.8', '8.8.4.4']);
        
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://SeifHassan:seifhassan17@crm.bagyzhs.mongodb.net/Database', {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Connected to MongoDB\n');
        
        const email = process.argv[2];
        if (!email) {
            console.log('Usage: node make-admin.js <email>');
            console.log('Example: node make-admin.js user@oracle.com');
            process.exit(1);
        }
        
        await makeUserAdmin(email);
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        process.exit(1);
    }
}

connectAndRun();
