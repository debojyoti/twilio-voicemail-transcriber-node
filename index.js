require("dotenv").config(); // Load environment variables
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const {
  decryptAudio,
  convertAudio,
  transcribeStreamAudio,
  uploadFileToS3, // Use s3Uploader.js instead of uploadToS3.js
  generateFileId
} = require("./audioProcessor");
const { getCallerNumber, downloadAudio, cleanupFiles } = require("./helpers"); // Import helper functions

// Initialize Express app
const app = express();
app.use(bodyParser.json()); // Parse incoming JSON requests

// POST endpoint to handle the Twilio webhook
app.post("/twilio-call-status", async (req, res) => {
  try {
    const {
      RecordingStatus,
      RecordingUrl,
      EncryptionDetails,
      RecordingSid,
      AccountSid,
      CallSid,
    } = req.body;

    if (RecordingStatus !== "completed") {
      return res.status(200).send("Recording not completed, nothing to process.");
    }

    // Step 1: Get the caller's number
    console.log("Fetching caller number...");
    const callerNumber = await getCallerNumber(AccountSid, CallSid);
    console.log("Caller number:", callerNumber);

    // Step 2: Download the encrypted audio file
    const encryptedFilePath = path.resolve(process.env.ENCRYPTED_AUDIO_PATH);
    console.log("Downloading audio file...");
    await downloadAudio(RecordingUrl, encryptedFilePath);
    console.log("Audio downloaded successfully.");

    // Step 3: Decrypt the audio file
    const pemKeyPath = path.resolve(process.env.TWILIO_PEM_KEY_PATH);
    const decryptedFilePath = path.resolve(process.env.DECRYPTED_AUDIO_PATH);
    console.log("Starting decryption...");
    await decryptAudio(
      encryptedFilePath,
      EncryptionDetails.encrypted_cek,
      EncryptionDetails.iv,
      pemKeyPath,
      decryptedFilePath
    );
    console.log("Decryption complete. Decrypted file saved at:", decryptedFilePath);

    // Step 4: Convert the decrypted audio file to PCM 16kHz mono using FFmpeg
    const convertedFilePath = path.resolve(process.env.CONVERTED_AUDIO_PATH);
    console.log("Starting audio conversion...");
    await convertAudio(decryptedFilePath, convertedFilePath);

    // Step 5: Upload the converted audio file to S3 and get the file ID
    console.log("Uploading file to S3...");
    const fileId = generateFileId(); // Generate a unique file ID
    await uploadFileToS3(convertedFilePath, fileId);

    // Step 6: Return frontend URL with file ID
    const frontendUrl = `https://mysawesomefrontendapp.com?id=${fileId}`;
    console.log("Frontend URL:", frontendUrl);

    // Clean up local files after uploading to S3
    await cleanupFiles([encryptedFilePath, decryptedFilePath, convertedFilePath]);

    res.status(200).json({ message: "Process completed successfully", frontendUrl });
  } catch (error) {
    console.error("Error processing Twilio call status:", error.message || error);
    res.status(500).json({ error: "Failed to process call status" });
  }
});

// Start Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
