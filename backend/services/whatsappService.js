let twilio;
try {
    twilio = require('twilio');
} catch (error) {
    console.warn('Twilio package not installed. WhatsApp functionality will be disabled.');
    twilio = null;
}

class WhatsAppService {
    constructor() {
        // Initialize Twilio client with environment variables
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
        
        // Only initialize Twilio client if credentials are available and twilio is installed
        if (twilio && this.accountSid && this.authToken && this.accountSid.startsWith('AC')) {
            try {
                this.client = twilio(this.accountSid, this.authToken);
                console.log('Twilio WhatsApp service initialized successfully');
            } catch (error) {
                console.warn('Failed to initialize Twilio client:', error.message);
                this.client = null;
            }
        } else {
            this.client = null;
            if (!this.accountSid || !this.authToken) {
                console.log('Twilio credentials not provided - WhatsApp functionality disabled');
            } else if (this.accountSid && !this.accountSid.startsWith('AC')) {
                console.log('Invalid Twilio Account SID format - WhatsApp functionality disabled');
            } else if (!twilio) {
                console.log('Twilio package not installed - WhatsApp functionality disabled');
            }
        }
    }

    // Format student data into WhatsApp message
    formatStudentUpdateMessage(studentData) {
        const { student, attendance, marks, grade, fees, parent } = studentData;
        
        let message = `📚 *Student Academic Update*\n\n`;
        message += `👤 *Student Information*\n`;
        message += `📝 Name: ${student.first_name} ${student.last_name}\n`;
        message += `🎓 Class: ${student.class_name} - ${student.section_name}\n`;
        message += `🔢 Roll No: ${student.roll_number}\n`;
        message += `📅 Academic Year: ${student.academic_year}\n\n`;
        
        message += `📊 *Academic Performance*\n`;
        message += `📈 Attendance: ${attendance.percentage}% (${attendance.presentDays}/${attendance.totalDays} days)\n`;
        
        if (marks && marks.length > 0) {
            message += `📝 Subject-wise Internal Marks:\n`;
            marks.forEach(mark => {
                message += `  • ${mark.subject_name}: ${mark.average_marks.toFixed(1)}/100\n`;
            });
        }
        
        message += `🏆 Overall Grade Point: ${grade.averageGradePoint.toFixed(2)}\n\n`;
        
        message += `💰 *Fee Information*\n`;
        message += `💳 Pending Amount: ₹${fees.pendingAmount.toFixed(2)}\n\n`;
        
        message += `📱 *Parent Contact*\n`;
        message += `👨 Father: ${parent.father_name || 'N/A'}\n`;
        message += `👩 Mother: ${parent.mother_name || 'N/A'}\n\n`;
        
        message += `---\n`;
        message += `📧 For any queries, please contact the school administration.\n`;
        message += `🏫 ${process.env.SCHOOL_NAME || 'School Management System'}`;
        
        return message;
    }

    // Send WhatsApp message
    async sendWhatsAppMessage(toNumber, message) {
        try {
            // Check if Twilio client is initialized
            if (!this.client) {
                return {
                    success: false,
                    error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.'
                };
            }

            // Format phone number for WhatsApp (remove any non-numeric characters and add country code if needed)
            let formattedNumber = toNumber.replace(/\D/g, '');
            if (!formattedNumber.startsWith('+')) {
                formattedNumber = '+91' + formattedNumber; // Default to India country code
            }

            const response = await this.client.messages.create({
                body: message,
                from: `whatsapp:${this.fromWhatsAppNumber}`,
                to: `whatsapp:${formattedNumber}`
            });

            console.log('WhatsApp message sent successfully:', response.sid);
            return {
                success: true,
                messageId: response.sid,
                status: response.status
            };
        } catch (error) {
            console.error('WhatsApp send error:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    // Send student update to parent
    async sendStudentUpdate(studentData) {
        if (!studentData.parentWhatsApp) {
            return {
                success: false,
                error: 'Parent WhatsApp number not found'
            };
        }

        const message = this.formatStudentUpdateMessage(studentData);
        return await this.sendWhatsAppMessage(studentData.parentWhatsApp, message);
    }

    // Test Twilio connection
    async testConnection() {
        try {
            if (!this.client) {
                return {
                    success: false,
                    error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.'
                };
            }

            const account = await this.client.api.accounts(this.accountSid).fetch();
            return {
                success: true,
                accountSid: account.sid,
                friendlyName: account.friendlyName
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new WhatsAppService();
