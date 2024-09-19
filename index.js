require("dotenv").config(); // Load environment variables
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const {
  decryptAudio,
  convertAudio,
  transcribeStreamAudio,
  uploadToS3,
} = require("./audioProcessor");
const { getCallerNumber, downloadAudio, cleanupFiles } = require("./helpers"); // Import helper functions

// Initialize express app
const app = express();
app.use(bodyParser.json());

// Endpoint to receive Twilio webhook
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
      return res.status(200).send("Ignored: Not a completed recording");
    }

    console.log("Received completed recording:", RecordingSid);

    // Step 1: Get the caller's number using Twilio Call Events API
    const callerNumber = await getCallerNumber(AccountSid, CallSid);
    console.log("Caller number:", callerNumber);

    // Step 2: Download the recording file
    const recordingPath = path.resolve(__dirname, "recording.wav");
    await downloadAudio(RecordingUrl, recordingPath);

    // Step 3: Decrypt the recording using the CEK and IV from the webhook
    const decryptedFilePath = path.resolve(__dirname, "decrypted.wav");
    await decryptAudio(
      recordingPath,
      EncryptionDetails.encrypted_cek,
      EncryptionDetails.iv,
      process.env.TWILIO_PEM_KEY_PATH,
      decryptedFilePath
    );
    console.log("Decryption complete. File saved to:", decryptedFilePath);

    // Step 4: Convert the decrypted file and upload it to S3
    const convertedFilePath = path.resolve(__dirname, "converted.wav");
    await convertAudio(decryptedFilePath, convertedFilePath);
    const publicUrl = await uploadToS3(
      convertedFilePath,
      process.env.S3_BUCKET_NAME
    );
    console.log("File uploaded to S3:", publicUrl);

    // Step 5: Optionally transcribe the converted audio file using AWS Transcribe Streaming
    const transcript = await transcribeStreamAudio(
      convertedFilePath,
      "en-US",
      16000
    );
    console.log("Transcription:", transcript);

    // Cleanup: Delete the local files after the process is done
    cleanupFiles([recordingPath, decryptedFilePath, convertedFilePath]);

    // Send a success response back to Twilio
    res.status(200).send("Processing initiated.");
  } catch (error) {
    console.error("Error processing Twilio call status:", error);
    res.status(500).send("Error processing recording");
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
