
# Twilio Encrypted Voicemail Transcriber

This project handles decryption of Twilio encrypted voicemail files, converts them to a suitable format using FFmpeg, and transcribes the audio using AWS Transcribe Streaming Service. Additionally, it uploads the audio file to an S3 bucket and generates a presigned URL via an AWS Lambda function for audio playback in the frontend.

## Features
- **Twilio Voicemail Decryption**: Fetches encryption details from Twilio and decrypts the audio file.
- **FFmpeg Audio Conversion**: Converts the decrypted audio file to PCM format with 16kHz sampling and mono channel, suitable for AWS Transcribe.
- **AWS Transcribe Streaming**: Streams the audio file to AWS Transcribe to generate real-time transcription.
- **S3 Upload**: Uploads the decrypted and converted audio file to an S3 bucket.
- **Presigned URL Generation**: Provides a presigned URL that allows frontend playback of the audio file. The URL is valid for 30 minutes.

---

## Table of Contents
- [Requirements](#requirements)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [How to Run](#how-to-run)
- [Lambda Function Setup](#lambda-function-setup)
- [Local Development Setup (Windows)](#local-development-setup-windows)
- [Local Development Setup (macOS/Linux)](#local-development-setup-macoslinux)
- [License](#license)

---

## Requirements
- **Node.js** (v14+)
- **FFmpeg** installed on your system
- **AWS Credentials** with permission to use S3 and AWS Transcribe
- **Twilio Account** with access to encrypted voicemail data
- **npm** (Node Package Manager)

---

## Project Structure

```
.
├── index.js                     # Main file to run the entire process
├── audioConverter.js            # Converts audio file to PCM 16kHz mono format using FFmpeg
├── twilioApi.js                 # Fetches encryption details from Twilio
├── decrypt.js                   # Handles decryption of the audio file using the provided encryption key
├── transcribeStreamAudio.js     # Streams the audio file to AWS Transcribe Streaming and retrieves transcription
├── s3Uploader.js                # Handles file uploads to S3 and generating unique file IDs
├── .env                         # Environment configuration file
├── encrypted/                   # Directory where encrypted audio files are stored
├── decrypted/                   # Directory where decrypted audio files are stored
├── converted/                   # Directory where converted audio files are stored (after FFmpeg conversion)
```

---

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/your-repository-url/twilio-voicemail-transcriber.git
   cd twilio-voicemail-transcriber
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Install **FFmpeg** on your system (see detailed instructions below).

---

## Environment Variables

Create a `.env` file in the root of the project and add the following environment variables:

```ini
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_RECORDING_SID=your_twilio_recording_sid
ENCRYPTED_AUDIO_PATH=./encrypted/your-encrypted-audio-file.wav
TWILIO_PEM_KEY_PATH=./keys/your-key.pem
DECRYPTED_AUDIO_PATH=./decrypted/output.wav
CONVERTED_AUDIO_PATH=./converted/output-16000.wav
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
FRONTEND_URL=https://mysawesomefrontendapp.com
```

These variables are:
- **TWILIO_ACCOUNT_SID**: Your Twilio account SID.
- **TWILIO_RECORDING_SID**: The recording SID for the voicemail.
- **ENCRYPTED_AUDIO_PATH**: The path to the encrypted Twilio audio file.
- **TWILIO_PEM_KEY_PATH**: The path to your private PEM key.
- **DECRYPTED_AUDIO_PATH**: The path where the decrypted audio will be saved.
- **CONVERTED_AUDIO_PATH**: The path where the converted audio will be saved after FFmpeg processing.
- **AWS_REGION**: The AWS region for your services.
- **S3_BUCKET_NAME**: Your S3 bucket name for storing audio files.
- **AWS_ACCESS_KEY_ID** and **AWS_SECRET_ACCESS_KEY**: AWS credentials.
- **FRONTEND_URL**: The frontend URL where the file ID will be passed as a query parameter.

---

## How to Run

Once the environment variables and FFmpeg setup are complete, you can run the project using:

```bash
node index.js
```

This will execute the following steps:
1. **Fetch encryption details** from Twilio.
2. **Decrypt the audio file** using the Twilio-provided encryption details.
3. **Convert the decrypted audio** to PCM 16kHz mono using FFmpeg.
4. **Upload the audio file** to an S3 bucket.
5. **Return a frontend URL** containing the file ID (e.g., `https://mysawesomefrontendapp.com?id=<file_id>`).
6. **Optionally transcribe** the audio file using AWS Transcribe Streaming.

---

## Lambda Function Setup

You will need an AWS Lambda function to generate a presigned URL for audio playback. This URL will allow the frontend to access the audio file for 30 minutes.

### Lambda Function Code:

```javascript
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize S3 client
const s3 = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  const bucketName = process.env.S3_BUCKET_NAME;
  const fileId = event.queryStringParameters.id;  // Get the file ID from the query string
  const fileKey = `${fileId}.wav`;  // The S3 key of the file
  
  // Set the presigned URL expiration (30 minutes)
  const expirationInSeconds = 30 * 60;

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    // Generate the presigned URL
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: expirationInSeconds });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        presignedUrl: presignedUrl,
      }),
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error generating presigned URL',
        error: error.message,
      }),
    };
  }
};
```

### Environment Variables for Lambda:

Make sure your Lambda function has the following environment variables set:
- `AWS_REGION`: Your AWS region (e.g., `us-east-1`).
- `S3_BUCKET_NAME`: The name of the S3 bucket where the files are stored.

---

## Local Development Setup (Windows)

### Step 1: Install Node.js and npm
- Download and install Node.js from [https://nodejs.org](https://nodejs.org).
- Verify installation:

  ```bash
  node -v
  npm -v
  ```

### Step 2: Install FFmpeg on Windows
1. **Download FFmpeg**:
   - Download FFmpeg from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html).
   - Extract the FFmpeg files to a location on your machine, such as `C:\ffmpeg`.

2. **Add FFmpeg to your system's PATH**:
   - Right-click on **This PC** → **Properties** → **Advanced system settings** → **Environment Variables**.
   - Under **System variables**, find the `Path` variable, click **Edit**, and add the path to the `bin` folder of FFmpeg (e.g., `C:\ffmpeg\bin`).

3. **Verify FFmpeg installation**:
   - Open a new **Command Prompt** and type:

     ```bash
     ffmpeg -version
     ```

   - You should see version information confirming FFmpeg is installed.

### Step 3: Configure `.env` File
- Follow the [Environment Variables](#environment-variables) section to set up your `.env` file.

---

## Local Development Setup (macOS/Linux)

### Step 1: Install Node.js and npm
- Download and install Node.js from [https://nodejs.org](https://nodejs.org).

### Step 2: Install FFmpeg
- For macOS:

  ```bash
  brew install ffmpeg
  ```

- For Ubuntu/Linux:

  ```bash
  sudo apt-get update
  sudo apt-get install ffmpeg
  ```

- Verify FFmpeg installation:

  ```bash
  ffmpeg -version
  ```

### Step 3: Configure `.env` File
- Follow the [Environment Variables](#environment-variables) section to set up your `.env` file.

---

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
