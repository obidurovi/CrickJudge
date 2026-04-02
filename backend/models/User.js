const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 80
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    passwordHash: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verification: {
        tokenHash: { type: String, default: null },
        expiresAt: { type: Date, default: null },
        verifiedAt: { type: Date, default: null }
    },
    passwordChangedAt: {
        type: Date,
        default: null
    },
    profile: {
        country: { type: String, default: '' },
        favoriteTeam: { type: String, default: '' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
