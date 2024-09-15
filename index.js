
// Load environment variables from .env file
require('dotenv').config();

const path = require('path');
const decryptAudio = require('./decrypt');
const uploadToS3 = require('./uploadToS3');
const { transcribeAudio, getTranscriptionResult } = require('./transcribeAudio');
const logResult = require('./logger');
const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async/fixed'); // Optional for better interval handling

// Optional: If using node-fetch, ensure it's imported
const fetch = require('node-fetch'); // If not already globally available

// Configuration
const encryptedFilePath = path.join(__dirname, 'encrypted', 'voicemail.enc'); // Adjust the path
const pemKeyPath = path.join(__dirname, 'keys', 'twilio_key.pem'); // Adjust the path
const decryptedFilePath = path.join(__dirname, 'decrypted', 'voicemail.wav'); // Adjust the path
const s3BucketName = 'your-s3-bucket-name'; // Replace with your S3 bucket name
const transcribeOutputBucket = 'your-transcribe-output-bucket'; // Replace with your Transcribe output bucket
const awsRegion = 'us-east-1'; // Replace with your AWS region

/**
 * Polls the transcription job until it's completed or failed.
 *
 * @param {string} jobName - Name of the transcription job.
 * @param {number} intervalMs - Polling interval in milliseconds.
 * @returns {Promise<string>} - The transcription text.
 */
async function pollTranscriptionJob(jobName, intervalMs = 30000) {
  const maxAttempts = 20; // Adjust based on expected job duration
  let attempts = 0;

  while (attempts < maxAttempts) {
    const transcript = await getTranscriptionResult(jobName, awsRegion);
    if (transcript) {
      return transcript;
    }
    console.log(`Polling attempt ${attempts + 1}/${maxAttempts}...`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempts += 1;
  }

  throw new Error('Transcription job did not complete within the expected time.');
}

(async () => {
  try {
    // Ensure decrypted directory exists
    const decryptedDir = path.dirname(decryptedFilePath);
    const fs = require('fs');
    if (!fs.existsSync(decryptedDir)) {
      fs.mkdirSync(decryptedDir, { recursive: true });
    }

    // Step 1: Decrypt the audio file
    decryptAudio(encryptedFilePath, pemKeyPath, decryptedFilePath);

    // Step 2: Upload decrypted audio to S3
    const publicUrl = await uploadToS3(decryptedFilePath, s3BucketName, awsRegion);

    // Convert public URL to S3 URI (required by Transcribe)
    const s3Uri = publicUrl.replace(`https://${s3BucketName}.s3.${awsRegion}.amazonaws.com/`, 's3://') + path.basename(decryptedFilePath);

    // Step 3: Start transcription
    const jobName = `transcription-${Date.now()}`;
    await transcribeAudio(s3Uri, jobName, awsRegion);

    // Step 4: Poll for transcription result
    const transcript = await pollTranscriptionJob(jobName, 30000); // Poll every 30 seconds

    if (transcript) {
      // Step 5: Log the public URL and transcript
      logResult(publicUrl, transcript);
    } else {
      console.error('Failed to retrieve transcription.');
    }
  } catch (error) {
    console.error('An error occurred during processing:', error);
  }
})();
