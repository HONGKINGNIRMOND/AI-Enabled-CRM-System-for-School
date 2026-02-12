const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');

class TelephonyService {
    constructor() {
        this.provider = process.env.TELEPHONY_PROVIDER || 'twilio'; // Default to Twilio
        this.client = null;

        // Check if Twilio credentials are configured
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (!accountSid || accountSid === 'your_twilio_account_sid' || !authToken || authToken === 'your_twilio_auth_token') {
            console.warn('Twilio credentials not configured. Telephony features will be disabled.');
            this.client = null;
            this.fromNumber = null;
            return;
        }

        switch (this.provider.toLowerCase()) {
            case 'twilio':
                this.client = twilio(accountSid, authToken);
                this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
                break;
            case 'vonage':
                // Vonage (Nexmo) implementation would go here
                // const Vonage = require('@vonage/server-sdk');
                // this.client = new Vonage({
                //   apiKey: process.env.VONAGE_API_KEY,
                //   apiSecret: process.env.VONAGE_API_SECRET
                // });
                break;
            default:
                // For flexible design, we'll implement a mock provider for demo purposes
                console.log(`Using mock telephony provider: ${this.provider}`);
                break;
        }
    }

    /**
     * Make an outbound call
     */
    async makeCall(toNumber, fromNumber = null, options = {}) {
        try {
            const callOptions = {
                to: toNumber,
                from: fromNumber || this.fromNumber,
                record: true, // Enable call recording
                ...options
            };

            switch (this.provider.toLowerCase()) {
                case 'twilio':
                    return await this.makeCallTwilio(callOptions);
                case 'vonage':
                    return await this.makeCallVonage(callOptions);
                default:
                    return await this.makeCallMock(callOptions);
            }
        } catch (error) {
            console.error('Error making call:', error);
            throw new Error(`Failed to initiate call: ${error.message}`);
        }
    }

    /**
     * Twilio implementation for making calls
     */
    async makeCallTwilio(options) {
        if (!this.client || !this.fromNumber) {
            console.warn('Twilio not configured, returning mock response');
            return await this.makeCallMock(options);
        }

        // Create a TwiML response for the call
        const twiml = new twilio.twiml.VoiceResponse();

        // For AI integration, we would connect to a webhook that handles the AI conversation
        if (options.aiEnabled) {
            twiml.connect().stream({
                url: `wss://${process.env.HOST_NAME || 'localhost:3000'}/api/calls/webhook`,
                statusCallback: `/api/calls/${options.callId}/event`,
                statusCallbackMethod: 'POST'
            });
        } else {
            twiml.say({
                voice: 'alice',
                language: 'en-US'
            }, options.message || 'Hello, this is a test call from the AI CRM system.');
        }

        // Initiate the call
        const call = await this.client.calls.create({
            to: options.to,
            from: options.from,
            twiml: twiml.toString(),
            record: options.record,
            statusCallback: options.statusCallback || `/api/calls/event`,
            statusCallbackMethod: 'POST'
        });

        return {
            success: true,
            callSid: call.sid,
            status: call.status,
            to: call.to,
            from: call.from,
            startTime: call.startTime,
            price: call.price,
            provider: 'twilio'
        };
    }

    /**
     * Vonage implementation for making calls (placeholder)
     */
    async makeCallVonage(options) {
        // Placeholder for Vonage implementation
        return {
            success: true,
            callId: uuidv4(),
            status: 'initiated',
            to: options.to,
            from: options.from,
            startTime: new Date(),
            provider: 'vonage'
        };
    }

    /**
     * Mock implementation for demo purposes
     */
    async makeCallMock(options) {
        // Simulate call initiation delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            success: true,
            callId: uuidv4(),
            status: 'initiated',
            to: options.to,
            from: options.from,
            startTime: new Date(),
            provider: 'mock',
            message: 'Call initiated successfully (mock)'
        };
    }

    /**
     * Get call status
     */
    async getCallStatus(callId) {
        try {
            switch (this.provider.toLowerCase()) {
                case 'twilio':
                    return await this.getCallStatusTwilio(callId);
                case 'vonage':
                    return await this.getCallStatusVonage(callId);
                default:
                    return await this.getCallStatusMock(callId);
            }
        } catch (error) {
            console.error('Error getting call status:', error);
            throw new Error(`Failed to get call status: ${error.message}`);
        }
    }

    async getCallStatusTwilio(callSid) {
        if (!this.client) {
            throw new Error('Twilio is not properly configured');
        }

        const call = await this.client.calls(callSid).fetch();
        return {
            callSid: call.sid,
            status: call.status,
            to: call.to,
            from: call.from,
            duration: call.duration,
            price: call.price,
            direction: call.direction,
            startTime: call.startTime,
            endTime: call.endTime
        };
    }

    async getCallStatusVonage(callId) {
        // Placeholder for Vonage implementation
        return {
            callId,
            status: 'completed',
            to: '+1234567890',
            from: '+0987654321',
            duration: '60',
            direction: 'outbound',
            startTime: new Date(),
            endTime: new Date(Date.now() + 60000)
        };
    }

    async getCallStatusMock(callId) {
        return {
            callId,
            status: 'completed',
            to: '+1234567890',
            from: '+0987654321',
            duration: 60,
            direction: 'outbound',
            startTime: new Date(Date.now() - 60000),
            endTime: new Date()
        };
    }

    /**
     * Get call recordings
     */
    async getCallRecordings(callId) {
        try {
            switch (this.provider.toLowerCase()) {
                case 'twilio':
                    return await this.getCallRecordingsTwilio(callId);
                case 'vonage':
                    return await this.getCallRecordingsVonage(callId);
                default:
                    return await this.getCallRecordingsMock(callId);
            }
        } catch (error) {
            console.error('Error getting call recordings:', error);
            throw new Error(`Failed to get call recordings: ${error.message}`);
        }
    }

    async getCallRecordingsTwilio(callSid) {
        if (!this.client) {
            throw new Error('Twilio is not properly configured');
        }

        const recordings = await this.client.recordings.list({ callSid });
        return recordings.map(rec => ({
            sid: rec.sid,
            uri: `https://api.twilio.com${rec.uri}`,
            duration: rec.duration,
            status: rec.status,
            type: rec.mediaType,
            dateCreated: rec.dateCreated
        }));
    }

    async getCallRecordingsVonage(callId) {
        // Placeholder for Vonage implementation
        return [];
    }

    async getCallRecordingsMock(callId) {
        return [{
            id: uuidv4(),
            url: `/api/calls/${callId}/recording`,
            duration: 60,
            status: 'available',
            type: 'audio/wav',
            dateCreated: new Date()
        }];
    }

    /**
     * Check if the service is properly configured
     */
    isConfigured() {
        if (!this.provider) return false;

        switch (this.provider.toLowerCase()) {
            case 'twilio':
                return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
            case 'vonage':
                return !!(process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET);
            default:
                return true; // Mock provider is always available for demo
        }
    }

    /**
     * Get provider information
     */
    getProviderInfo() {
        return {
            provider: this.provider,
            configured: this.isConfigured()
        };
    }
}

module.exports = new TelephonyService();