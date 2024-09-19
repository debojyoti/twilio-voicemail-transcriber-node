# Twilio Voicemail Transcriber with AWS Transcribe and S3

This project decrypts Twilio voicemail recordings, converts them to a usable audio format, uploads them to AWS S3, transcribes the audio using AWS Transcribe Streaming API, and logs the result. Additionally, it sends an email notification using SendGrid with transcription details and a link to the recorded file.

## Features

- Decrypt Twilio voicemail recordings.
- Convert audio files to PCM 16kHz mono.
- Upload converted audio files to AWS S3.
- Transcribe audio using AWS Transcribe Streaming API.
- Send an email notification using SendGrid with transcription and recording URL.
- Cleans up temporary files after processing.

## Prerequisites

To run this project, you need the following:

1. **Node.js** (v14.x or later)
2. **AWS Account** with permissions to access **S3** and **Transcribe Streaming**.
3. **Twilio Account** to handle encrypted recordings and get webhook responses.
4. **SendGrid Account** with a verified sender email for sending email notifications.

## Environment Variables

Create a `.env` file in the root directory of the project with the following variables:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region

# S3 Configuration
S3_BUCKET_NAME=your_s3_bucket_name

# Twilio Configuration
TWILIO_PEM_KEY_PATH=./keys/twilio_key.pem
ENCRYPTED_AUDIO_PATH=./encrypted/voicemail.wav
DECRYPTED_AUDIO_PATH=./decrypted/voicemail.wav
CONVERTED_AUDIO_PATH=./decrypted/output-16000.wav
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_RECORDING_SID=your_twilio_recording_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Transcription Configuration
TRANSCRIBE_LANGUAGE_CODE=en-US
TRANSCRIBE_SAMPLE_RATE=16000  # Sample rate in Hz

# Logging Configuration
LOG_FILE_PATH=./logs.json

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sendgrid_sender_email
SENDGRID_TO_EMAIL=recipient_email_address

# Frontend URL
FRONTEND_URL=https://your-frontend-url.com
```

## Folder Structure

```bash
.
├── audioProcessor.js        # Handles decryption, conversion, transcription, and S3 upload
├── decrypt.js               # Handles decryption of the encrypted audio
├── audioConverter.js        # Converts audio to PCM 16kHz mono
├── helpers.js               # Helper functions (get caller number, download audio, cleanup)
├── s3Uploader.js            # S3 upload and file ID generation logic
├── transcribeStreamAudio.js # Handles AWS Transcribe Streaming
├── logger.js                # Logs transcription and upload information
├── index.js                 # Main Express server and webhook handler
├── .env                     # Environment variables
└── temp-files/              # Temporary files folder for storing audio during processing
```

## Setup Instructions

### 1. Install Dependencies

Clone this repository and run the following command to install dependencies:

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the necessary environment variables (see above).

### 3. Running the Server

To run the server locally, use the following command:

```bash
npm start
```

This will start the Express server on `http://localhost:3000`.

### 4. Exposing the Webhook

Expose the `/twilio-call-status` endpoint for Twilio to call via a webhook using a tool like [ngrok](https://ngrok.com/). For example:

```bash
ngrok http 3000
```

Update your Twilio webhook configuration to point to your public `ngrok` URL, like this:

```
POST http://your-ngrok-url/twilio-call-status
```

## API Endpoints

### `POST /twilio-call-status`

This endpoint is triggered by Twilio when a call is completed, and the recording is ready.

#### Sample Request Body (Webhook Payload)

```json
{
  "RecordingSid": "REbb5fba4f6f4cd75b7ca032b1c7541bcb",
  "RecordingUrl": "https://api.twilio.com/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXX/Recordings/REbb5fba4f6f4cd75b7ca032b1c7541bcb",
  "RecordingStatus": "completed",
  "encryption_details": {
    "public_key_sid": "CRXXXXXXXXXXXXXXXX",
    "encrypted_cek": "VnMJNYu8jn1ShJc6mTjXkR8yqyNgE4S3i0YnXBFshfx8OuM2in4cPF+i7rgjt6CyJDPvoYRLNU+oJv7NFcWqRugyShiezp1gPIdDY6B/Hxv+lqdgqAHBXgX0sp3snLAzzWJISip68qfm6r1rl6vVAMG8oSYfk5x+9adqqTFs9yuUd3kC6ewvh33lMNqgeyYANTjnNFR3g9VRggFpyekAZChMbSX/r/pNacK1hcMh/lrmGzqIlrmM0LYTQgwpICZtdQ0hM2CBnxnCm7cvwDKYXz2uodHglmOprMwMzmQOxny8MROlYfP2JDnsqz0VOXOYCgfkdHuNAfH+iOFDN125EQ==",
    "type": "rsa-aes",
    "iv": "csPlIO1bSTGzybLp"
  },
  "CallSid": "CAxxxxxxxxxxxxxxxx",
  "AccountSid": "ACXXXXXXXXXXXXXXXXX"
}
```

## Process Flow

1. **Caller makes a call**: Once the call ends, Twilio will send a webhook to the `/twilio-call-status` endpoint with the call details and recording URL.
   
2. **Download and Process Recording**:
   - Download the encrypted audio from Twilio.
   - Decrypt the audio file using the encryption details.
   - Convert the decrypted audio to PCM 16kHz mono.
   - Upload the converted audio to AWS S3.

3. **Transcribe the Audio**:
   - Use AWS Transcribe Streaming API to get the transcription of the audio.

4. **Send Email Notification**:
   - Send an email using SendGrid with the following details:
     - Transcription text.
     - The link to the audio recording stored in S3.
     - Predefined reason for the call.

5. **Clean Up**:
   - Delete temporary files after the process is complete.

## Email Notification Format

- **Subject**: `(${new Date().toISOString()}) New Voicemail from: ${FromMobile}`
- **Content**:

```text
A new Voicemail has been received:
Transcription is: ${transcriptionText}
Recording URL is: ${s3Url}
Reason for call: ChildCare Services in WA, CA, IL, MA and CT
```

## Troubleshooting

- Ensure your `.env` file is properly configured, especially for Twilio, AWS, and SendGrid settings.
- Check for proper permissions in AWS S3 and Transcribe services.
- Ensure the SendGrid sender email is verified and allowed to send emails.

## License

This project is licensed under the MIT License.
```

### Key Updates in README:

- **SendGrid integration**: The email sending logic is explained.
- **Process flow**: Updated to reflect the steps involved in downloading, processing, transcribing, uploading to S3, and sending email notifications.
- **Environment setup**: Clear guidance on setting up `.env` file, including all necessary environment variables.
- **New folder structure**: Updated to match the current project structure.
- **Troubleshooting section**: Included for common setup issues.