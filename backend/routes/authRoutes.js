const express = require('express');
const { register, verifyEmail, resendVerificationEmail } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

module.exports = router;
