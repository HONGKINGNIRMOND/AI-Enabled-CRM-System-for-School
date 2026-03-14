const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { query } = require('../config/database');

// Email transporter
const emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Twilio client for SMS and WhatsApp
let twilioClient = null;
try {
    if (process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
        process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid') {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('Twilio client initialized');
    } else {
        console.warn('Twilio credentials missing or invalid (Skipping SMS/WhatsApp)');
    }
} catch (error) {
    console.error('Failed to initialize Twilio client:', error.message);
}

/**
 * Send email notification
 */
async function sendEmail(to, subject, text, html = null) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to,
            subject,
            text,
            html: html || text
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send SMS notification
 */
async function sendSMS(to, message) {
    try {
        if (!twilioClient) {
            throw new Error('Twilio not configured');
        }

        const result = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to
        });

        console.log('SMS sent:', result.sid);
        return { success: true, messageId: result.sid };
    } catch (error) {
        console.error('SMS send error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send WhatsApp notification
 */
async function sendWhatsApp(to, message) {
    try {
        if (!twilioClient || process.env.WHATSAPP_ENABLED !== 'true') {
            throw new Error('WhatsApp not configured');
        }

        const result = await twilioClient.messages.create({
            body: message,
            from: process.env.WHATSAPP_FROM,
            to: `whatsapp:${to}`
        });

        console.log('WhatsApp sent:', result.sid);
        return { success: true, messageId: result.sid };
    } catch (error) {
        console.error('WhatsApp send error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send notification via specified channel
 */
async function sendNotification(recipientId, recipientType, notificationTypeId, title, message, channel = 'email', metadata = null) {
    try {
        // Insert notification record
        const result = await query(
            `INSERT INTO notifications 
      (notification_type_id, recipient_id, recipient_type, title, message, channel, status, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
      RETURNING id`,
            [notificationTypeId, recipientId, recipientType, title, message, channel, JSON.stringify(metadata)]
        );

        const notificationId = result[0].id;

        // Get recipient contact details
        let contactInfo = null;
        if (recipientType === 'user') {
            const users = await query('SELECT email, phone FROM users WHERE id = $1', [recipientId]);
            if (users.length > 0) contactInfo = users[0];
        }

        // Send via appropriate channel
        let sendResult = null;
        switch (channel) {
            case 'email':
                if (contactInfo.email) {
                    sendResult = await sendEmail(contactInfo.email, title, message);
                }
                break;
            case 'sms':
                if (contactInfo.phone) {
                    sendResult = await sendSMS(contactInfo.phone, message);
                }
                break;
            case 'whatsapp':
                if (contactInfo.phone) {
                    sendResult = await sendWhatsApp(contactInfo.phone, message);
                }
                break;
            case 'in-app':
                sendResult = { success: true }; // In-app notifications are stored in DB
                break;
        }

        // Update notification status
        if (sendResult && sendResult.success) {
            await query(
                'UPDATE notifications SET status = $1, sent_at = NOW() WHERE id = $2',
                ['sent', notificationId]
            );
        } else {
            await query(
                'UPDATE notifications SET status = $1, error_message = $2 WHERE id = $3',
                ['failed', sendResult?.error || 'Unknown error', notificationId]
            );
        }

        return { success: sendResult?.success || false, notificationId };
    } catch (error) {
        console.error('Send notification error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendEmail,
    sendSMS,
    sendWhatsApp,
    sendNotification
};
