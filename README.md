

# Twilio Encrypted Voicemail Transcriber

This project decrypts a Twilio encrypted voicemail audio file, converts it to a suitable format using FFmpeg, and then transcribes the audio using AWS Transcribe Streaming Service. The process is divided into several steps that include fetching encryption details, decrypting the audio file, converting it to the correct format, and finally transcribing it using AWS services.

## Features
- **Twilio Voicemail Decryption**: Fetches encryption details from Twilio and decrypts the audio file.
- **FFmpeg Audio Conversion**: Converts the decrypted audio file to PCM format with 16kHz sampling and mono channel, suitable for AWS Transcribe.
- **AWS Transcribe Streaming**: Streams the audio file to AWS Transcribe and retrieves the transcription in real-time.
- **Error Handling**: Proper error handling during decryption, conversion, and transcription processes.

---

## Table of Contents
- [Requirements](#requirements)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [How to Run](#how-to-run)
- [Local Development Setup (Windows)](#local-development-setup-windows)
- [Local Development Setup (macOS/Linux)](#local-development-setup-macoslinux)
- [License](#license)

---

## Requirements
- **Node.js** (v14+)
- **FFmpeg** installed on your system
- **AWS Credentials** with permission to use AWS Transcribe
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
├── transcribeStreamAudio.js     # Handles streaming audio file to AWS Transcribe Streaming and capturing results
├── .env                         # Environment configuration file
├── encrypted/                   # Directory where encrypted audio files are stored
├── decrypted/                   # Directory where decrypted audio files are stored
└── converted/                   # Directory where converted audio files are stored (after FFmpeg conversion)
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
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

These variables are:
- **TWILIO_ACCOUNT_SID**: Your Twilio account SID.
- **TWILIO_RECORDING_SID**: The recording SID for the voicemail.
- **ENCRYPTED_AUDIO_PATH**: The path to the encrypted Twilio audio file.
- **TWILIO_PEM_KEY_PATH**: The path to your private PEM key.
- **DECRYPTED_AUDIO_PATH**: The path where the decrypted audio will be saved.
- **AWS_REGION**: The AWS region for your services.
- **AWS_ACCESS_KEY_ID** and **AWS_SECRET_ACCESS_KEY**: AWS credentials.

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
4. **Transcribe the audio** using AWS Transcribe Streaming and print the final transcript.

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

---

Let me know if you need any further changes or adjustments!