const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

class WhisperService {
    constructor() {
        this.apiKey = process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY;
        this.baseUrl = 'https://api.openai.com/v1';
    }

    /**
     * Transcribe audio file using OpenAI's Whisper API
     * In a real implementation with open-source Whisper, this would connect to a local model
     */
    async transcribeAudio(filePath, options = {}) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`Audio file does not exist: ${filePath}`);
            }

            if (this.apiKey) {
                // Use OpenAI's Whisper API
                return await this.transcribeWithOpenAI(filePath, options);
            } else {
                // Fallback to local processing (placeholder implementation)
                return await this.transcribeLocally(filePath, options);
            }
        } catch (error) {
            console.error('Error in transcribeAudio:', error);
            throw new Error(`Failed to transcribe audio: ${error.message}`);
        }
    }

    /**
     * Transcribe using OpenAI's API
     */
    async transcribeWithOpenAI(filePath, options) {
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('model', options.model || 'whisper-1');
            formData.append('response_format', options.response_format || 'json');

            if (options.language) {
                formData.append('language', options.language);
            }

            if (options.prompt) {
                formData.append('prompt', options.prompt);
            }

            const response = await axios.post(`${this.baseUrl}/audio/transcriptions`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${this.apiKey}`
                },
                timeout: 60000 // 60 seconds timeout
            });

            return response.data;
        } catch (error) {
            console.error('Error with OpenAI Whisper:', error);
            throw new Error(`Whisper API error: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
     * Transcribe using local Whisper model (placeholder implementation)
     * In a real implementation, this would connect to a locally hosted Whisper model
     */
    async transcribeLocally(filePath, options) {
        // This is a placeholder - in a real implementation, you would:
        // 1. Use a library like '@vladmandic/whisper' for local inference
        // 2. Connect to a locally hosted Whisper API
        // 3. Or use Python subprocess to call Whisper

        console.log(`Processing audio file locally: ${filePath}`);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Return a placeholder result
        return {
            text: "This is a simulated transcription result. In a real implementation, this would be the actual transcription from a local Whisper model.",
            language: "en",
            duration: 120.5, // in seconds
            segments: [
                {
                    id: 0,
                    seek: 0,
                    start: 0.0,
                    end: 5.0,
                    text: "This is a simulated transcription segment.",
                    tokens: [50966, 13, 2045, 338, 1261, 290, 13, 50966],
                    temperature: 0.0,
                    avg_logprob: -0.2,
                    compression_ratio: 0.62,
                    no_speech_prob: 0.07
                }
            ]
        };
    }

    /**
     * Transcribe audio buffer directly
     */
    async transcribeBuffer(buffer, filename, options = {}) {
        try {
            // Write buffer to temporary file
            const tempPath = `./temp_${Date.now()}_${filename}`;
            fs.writeFileSync(tempPath, buffer);

            try {
                const result = await this.transcribeAudio(tempPath, options);
                return result;
            } finally {
                // Clean up temporary file
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
            }
        } catch (error) {
            console.error('Error transcribing buffer:', error);
            throw new Error(`Failed to transcribe buffer: ${error.message}`);
        }
    }

    /**
     * Check if the service is configured properly
     */
    isConfigured() {
        return !!this.apiKey;
    }
}

module.exports = new WhisperService();