const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

const isStrongPassword = (password) => {
    const value = String(password || '');
    if (value.length < 8) return false;
    if (!/[a-z]/.test(value)) return false;
    if (!/[A-Z]/.test(value)) return false;
    if (!/[0-9]/.test(value)) return false;
    return true;
};

const register = async (req, res) => {
    try {
        const name = String(req.body?.name || '').trim();
        const email = String(req.body?.email || '').trim().toLowerCase();
        const password = String(req.body?.password || '');

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'name, email and password are required' });
        }

        if (name.length < 2) {
            return res.status(400).json({ message: 'Name must be at least 2 characters' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Enter a valid email address' });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number'
            });
        }

        const existingUser = await User.findOne({ email }).lean();
        if (existingUser) {
            return res.status(409).json({ message: 'An account already exists with this email' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
        const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const user = await User.create({
            name,
            email,
            passwordHash,
            isEmailVerified: false,
            verification: {
                tokenHash: verificationTokenHash,
                expiresAt: verificationTokenExpiresAt
            }
        });

        const response = {
            message: 'Registration successful. Verify your email to activate your account.',
            user: {
                id: String(user._id),
                name: user.name,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt
            },
            verification: {
                required: true,
                expiresAt: verificationTokenExpiresAt.toISOString()
            }
        };

        if (process.env.NODE_ENV !== 'production') {
            response.devVerificationToken = verificationToken;
        }

        return res.status(201).json(response);
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'An account already exists with this email' });
        }
        return res.status(500).json({ message: error.message || 'Registration failed' });
    }
};

module.exports = {
    register
};
