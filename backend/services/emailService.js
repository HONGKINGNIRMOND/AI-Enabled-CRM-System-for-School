const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // Configure email transport
        // In production, use proper email service like SendGrid, Mailgun, etc.
        this.transporter = nodemailer.createTransporter({
            // For development, we can use ethereal.email (fake SMTP service)
            host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
            port: process.env.EMAIL_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER || 'your-fake-email@ethereal.email',
                pass: process.env.EMAIL_PASS || 'your-fake-password'
            }
        });

        // Verify transporter configuration
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('Email service is ready to send messages');
        } catch (error) {
            console.error('Email service configuration error:', error);
        }
    }

    /**
     * Send an email notification
     */
    async sendMail(to, subject, html, text = null) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || '"AI CRM System" <noreply@aicrmsystem.com>',
                to,
                subject,
                text: text || html.replace(/<[^>]*>?/gm, ''), // Plain text fallback
                html
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);

            return {
                success: true,
                messageId: info.messageId,
                recipients: info.accepted
            };
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Send call summary notification
     */
    async sendCallSummaryNotification(callRecord, recipientEmail) {
        const html = `
      <h2>AI CRM - Call Summary</h2>
      <p><strong>Call ID:</strong> ${callRecord.id}</p>
      <p><strong>Date:</strong> ${new Date(callRecord.createdAt).toLocaleString()}</p>
      <p><strong>Caller:</strong> ${callRecord.caller?.name || 'Unknown'}</p>
      <p><strong>Called Party:</strong> ${callRecord.calleeLead?.name || callRecord.calleeCustomer?.name || 'Unknown'}</p>
      <p><strong>Duration:</strong> ${callRecord.duration || 'N/A'} seconds</p>
      <p><strong>Status:</strong> ${callRecord.callStatus}</p>
      <p><strong>Sentiment Score:</strong> ${callRecord.sentimentScore || 'N/A'}</p>
      
      <h3>Transcript:</h3>
      <p>${callRecord.transcript || 'No transcript available'}</p>
      
      <h3>Summary:</h3>
      <p>${callRecord.summary || 'No summary available'}</p>
    `;

        return await this.sendMail(
            recipientEmail,
            `Call Summary - ${callRecord.id}`,
            html
        );
    }

    /**
     * Send lead notification
     */
    async sendLeadNotification(lead, recipientEmail) {
        const html = `
      <h2>New Lead Created</h2>
      <p><strong>Name:</strong> ${lead.name}</p>
      <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
      <p><strong>Phone:</strong> ${lead.phone || 'N/A'}</p>
      <p><strong>Company:</strong> ${lead.company || 'N/A'}</p>
      <p><strong>Status:</strong> ${lead.status}</p>
      <p><strong>Created:</strong> ${new Date(lead.createdAt).toLocaleString()}</p>
    `;

        return await this.sendMail(
            recipientEmail,
            `New Lead: ${lead.name}`,
            html
        );
    }

    /**
     * Send system notification
     */
    async sendSystemNotification(subject, message, recipientEmail) {
        const html = `
      <h2>AI CRM System Notification</h2>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      <p><em>This is an automated message from the AI CRM system.</em></p>
    `;

        return await this.sendMail(
            recipientEmail,
            `AI CRM: ${subject}`,
            html
        );
    }
}

module.exports = new EmailService();