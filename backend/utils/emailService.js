const nodemailer = require('nodemailer');

let transporter = null;

const hasSmtpConfig = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);

const getTransporter = () => {
    if (transporter) return transporter;

    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
    const auth = process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined;

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth
    });

    return transporter;
};

const sendVerificationEmail = async ({ to, name, code }) => {
    const normalizedCode = String(code || '').trim();
    if (!normalizedCode) {
        throw new Error('Verification code is required for email delivery');
    }

    if (!hasSmtpConfig()) {
        return {
            sent: false,
            reason: 'SMTP_NOT_CONFIGURED'
        };
    }

    const mailText = [
        `Hi ${name || 'there'},`,
        '',
        'Welcome to CrickJudge.',
        `Your verification code is: ${normalizedCode}`,
        'Enter this code in the app to verify your account.',
        '',
        'This code expires in 24 hours.',
        '',
        'If you did not create this account, you can ignore this email.'
    ].join('\n');

    const mailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
            <h2 style="margin: 0 0 12px;">Verify your CrickJudge account</h2>
            <p>Hi ${name || 'there'},</p>
            <p>Welcome to CrickJudge. Enter this verification code in the app:</p>
            <p>
                <span style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 8px; font-weight: 700; letter-spacing: 0.12em; font-size: 22px;">
                    ${normalizedCode}
                </span>
            </p>
            <p>This code expires in 24 hours.</p>
            <p>If you did not create this account, you can ignore this email.</p>
        </div>
    `;

    await getTransporter().sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: 'Verify your CrickJudge account',
        text: mailText,
        html: mailHtml
    });

    return {
        sent: true,
        reason: null
    };
};

module.exports = {
    sendVerificationEmail,
    hasSmtpConfig
};
