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
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
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
        } else if (recipientType === 'parent') {
            const parents = await query('SELECT email, phone FROM parents WHERE id = $1', [recipientId]);
            if (parents.length > 0) contactInfo = parents[0];
        }

        if (!contactInfo) {
            await query(
                'UPDATE notifications SET status = $1, error_message = $2 WHERE id = $3',
                ['failed', 'Recipient contact info not found', notificationId]
            );
            return { success: false, error: 'Contact info not found' };
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

/**
 * Send attendance notification to parents
 */
async function sendAttendanceNotification(studentId, attendanceDate, status) {
    try {
        if (process.env.ATTENDANCE_NOTIFICATION_ENABLED !== 'true') {
            return { success: false, message: 'Attendance notifications disabled' };
        }

        // Get student and parent info
        const studentInfo = await query(
            `SELECT 
        s.first_name, s.last_name, s.registration_number,
        p.id as parent_id, p.first_name as parent_first_name, p.phone, p.email
       FROM students s
       JOIN student_parents sp ON s.id = sp.student_id
       JOIN parents p ON sp.parent_id = p.id
       WHERE s.id = $1 AND sp.is_primary_contact = TRUE`,
            [studentId]
        );

        if (studentInfo.length === 0) {
            return { success: false, message: 'No primary contact found' };
        }

        const student = studentInfo[0];
        const title = `Attendance Update - ${student.first_name} ${student.last_name}`;
        const message = `Dear ${student.parent_first_name},\n\nYour child ${student.first_name} ${student.last_name} (${student.registration_number}) was marked ${status} on ${attendanceDate}.\n\nRegards,\n${process.env.SCHOOL_NAME}`;

        // Get notification type ID
        const notificationType = await query(
            "SELECT id FROM notification_types WHERE type_name = 'attendance'"
        );

        // Send via email and SMS
        await sendNotification(student.parent_id, 'parent', notificationType[0].id, title, message, 'email');
        await sendNotification(student.parent_id, 'parent', notificationType[0].id, title, message, 'sms');

        return { success: true };
    } catch (error) {
        console.error('Send attendance notification error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send marks notification to parents
 */
async function sendMarksNotification(studentId, subjectName, marks, maxMarks) {
    try {
        if (process.env.MARKS_NOTIFICATION_ENABLED !== 'true') {
            return { success: false, message: 'Marks notifications disabled' };
        }

        const studentInfo = await query(
            `SELECT 
        s.first_name, s.last_name, s.registration_number,
        p.id as parent_id, p.first_name as parent_first_name
       FROM students s
       JOIN student_parents sp ON s.id = sp.student_id
       JOIN parents p ON sp.parent_id = p.id
       WHERE s.id = $1 AND sp.is_primary_contact = TRUE`,
            [studentId]
        );

        if (studentInfo.length === 0) {
            return { success: false, message: 'No primary contact found' };
        }

        const student = studentInfo[0];
        const percentage = ((marks / maxMarks) * 100).toFixed(2);
        const title = `Marks Update - ${subjectName}`;
        const message = `Dear ${student.parent_first_name},\n\nMarks for ${student.first_name} ${student.last_name} in ${subjectName}:\nMarks: ${marks}/${maxMarks} (${percentage}%)\n\nRegards,\n${process.env.SCHOOL_NAME}`;

        const notificationType = await query(
            "SELECT id FROM notification_types WHERE type_name = 'marks'"
        );

        await sendNotification(student.parent_id, 'parent', notificationType[0].id, title, message, 'email');

        return { success: true };
    } catch (error) {
        console.error('Send marks notification error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendEmail,
    sendSMS,
    sendWhatsApp,
    sendNotification,
    sendAttendanceNotification,
    sendMarksNotification
};
