// Load environment variables from .env file
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const decryptAudio = require("./decrypt");
const uploadToS3 = require("./uploadToS3");
const logResult = require("./logger");
const transcribeStreamAudio = require("./transcribeStreamAudio");

// Configuration from environment variables
const encryptedFilePath = path.resolve(process.env.ENCRYPTED_AUDIO_PATH);
const pemKeyPath = path.resolve(process.env.TWILIO_PEM_KEY_PATH);
const decryptedFilePath = path.resolve(process.env.DECRYPTED_AUDIO_PATH);
const s3BucketName = process.env.S3_BUCKET_NAME;
const awsRegion = process.env.AWS_REGION;
const logFilePath = path.resolve(process.env.LOG_FILE_PATH);

// AWS Transcribe Streaming configuration
const languageCode = process.env.TRANSCRIBE_LANGUAGE_CODE || "en-US";
const sampleRate = process.env.TRANSCRIBE_SAMPLE_RATE || "16000"; // Default 16 kHz

(async () => {
  try {
    // Step 1: Decrypt the audio file from Twilio
    decryptAudio(encryptedFilePath, pemKeyPath, decryptedFilePath);

    // Step 2: Upload the decrypted file to S3 for storage (optional)
    const publicUrl = await uploadToS3(
      decryptedFilePath,
      s3BucketName,
      awsRegion
    );
    console.log(`Decrypted file uploaded to S3: ${publicUrl}`);

    // Step 3: Stream the decrypted audio file to Amazon Transcribe for real-time transcription
    const transcript = await transcribeStreamAudio(
      decryptedFilePath,
      languageCode,
      sampleRate,
      awsRegion
    );

    if (transcript) {
      // Step 4: Log the transcription result and the S3 URL
      logResult(publicUrl, transcript, logFilePath);
      console.log(`Transcription: ${transcript}`);
    } else {
      console.error("Failed to retrieve transcription.");
    }
  } catch (error) {
    console.error("An error occurred during processing:", error);
  }
})();
