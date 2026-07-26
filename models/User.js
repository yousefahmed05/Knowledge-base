const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function() {
    // Only hash if password is modified or new
    if (!this.isModified('password')) {
        return;
    }

    try {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
    } catch (err) {
        throw err;
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(submittedPassword) {
    return await bcrypt.compare(submittedPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
