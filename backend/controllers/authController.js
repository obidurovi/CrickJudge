const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/emailService');

const VERIFICATION_CODE_TTL_MS = 24 * 60 * 60 * 1000;

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

const isStrongPassword = (password) => {
    const value = String(password || '');
    if (value.length < 8) return false;
    if (!/[a-z]/.test(value)) return false;
    if (!/[A-Z]/.test(value)) return false;
    if (!/[0-9]/.test(value)) return false;
    return true;
};

const hashValue = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

const createVerificationCodeBundle = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    return {
        code,
        codeHash: hashValue(code),
        expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS)
    };
};

const publicUser = (user) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    isEmailVerified: Boolean(user.isEmailVerified),
    createdAt: user.createdAt
});

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
        const verificationBundle = createVerificationCodeBundle();

        const user = await User.create({
            name,
            email,
            passwordHash,
            isEmailVerified: false,
            verification: {
                codeHash: verificationBundle.codeHash,
                expiresAt: verificationBundle.expiresAt,
                lastSentAt: new Date()
            }
        });

        let delivery = { sent: false, reason: 'UNKNOWN' };
        try {
            delivery = await sendVerificationEmail({
                to: user.email,
                name: user.name,
                code: verificationBundle.code
            });
        } catch (mailError) {
            delivery = {
                sent: false,
                reason: mailError?.message || 'EMAIL_SEND_FAILED'
            };
        }

        const response = {
            message: delivery.sent
                ? 'Registration successful. Verification code sent to your email.'
                : 'Registration successful. Verification code email could not be sent automatically.',
            user: publicUser(user),
            verification: {
                required: true,
                method: 'code',
                delivery: delivery.sent ? 'email' : 'manual',
                expiresAt: verificationBundle.expiresAt.toISOString()
            }
        };

        if (process.env.NODE_ENV !== 'production') {
            response.devVerificationCode = verificationBundle.code;
            response.deliveryReason = delivery.reason;
        }

        if (!delivery.sent) {
            response.notice = 'Configure SMTP settings in backend/.env to send verification emails automatically.';
        }

        return res.status(201).json(response);
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'An account already exists with this email' });
        }
        return res.status(500).json({ message: error.message || 'Registration failed' });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        const code = String(req.body?.code || '').trim();

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }

        if (!code) {
            return res.status(400).json({ message: 'Verification code is required' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Code doesn't match." });
        }

        if (user.isEmailVerified) {
            return res.status(200).json({
                message: 'Email is already verified',
                user: publicUser(user)
            });
        }

        const expiresAt = user?.verification?.expiresAt ? new Date(user.verification.expiresAt) : null;
        if (!expiresAt || expiresAt.getTime() < Date.now()) {
            return res.status(400).json({ message: 'Verification code has expired. Request a new one.' });
        }

        const providedCodeHash = hashValue(code);
        const storedCodeHash = String(user?.verification?.codeHash || '');
        if (!storedCodeHash || storedCodeHash !== providedCodeHash) {
            return res.status(400).json({ message: "Code doesn't match." });
        }

        user.isEmailVerified = true;
        user.verification = {
            codeHash: null,
            expiresAt: null,
            lastSentAt: null,
            verifiedAt: new Date()
        };
        await user.save();

        return res.status(200).json({
            message: 'Email verified successfully. You can continue to login.',
            user: publicUser(user)
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Email verification failed' });
    }
};

const resendVerificationEmail = async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({
                message: 'If an account exists for this email, a verification message has been sent.'
            });
        }

        if (user.isEmailVerified) {
            return res.status(200).json({
                message: 'This email is already verified.',
                user: publicUser(user)
            });
        }

        const verificationBundle = createVerificationCodeBundle();
        user.verification = {
            codeHash: verificationBundle.codeHash,
            expiresAt: verificationBundle.expiresAt,
            lastSentAt: new Date(),
            verifiedAt: null
        };
        await user.save();

        let delivery = { sent: false, reason: 'UNKNOWN' };
        try {
            delivery = await sendVerificationEmail({
                to: user.email,
                name: user.name,
                code: verificationBundle.code
            });
        } catch (mailError) {
            delivery = {
                sent: false,
                reason: mailError?.message || 'EMAIL_SEND_FAILED'
            };
        }

        const response = {
            message: delivery.sent
                ? 'Verification code sent. Please check your inbox.'
                : 'Verification code regenerated. Email delivery is not configured.',
            verification: {
                required: true,
                method: 'code',
                delivery: delivery.sent ? 'email' : 'manual',
                expiresAt: verificationBundle.expiresAt.toISOString()
            }
        };

        if (process.env.NODE_ENV !== 'production') {
            response.devVerificationCode = verificationBundle.code;
            response.deliveryReason = delivery.reason;
        }

        if (!delivery.sent) {
            response.notice = 'Configure SMTP settings in backend/.env to send verification emails automatically.';
        }

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Could not resend verification email' });
    }
};

module.exports = {
    register,
    verifyEmail,
    resendVerificationEmail
};
