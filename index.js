require("dotenv").config(); // Load environment variables
const express = require("express");
const path = require("path");
const fs = require("fs");
const { getCallerNumber, downloadAudio, cleanupFiles } = require("./helpers"); // Helper functions
const {
  decryptAudio,
  convertAudio,
  transcribeStreamAudio,
  uploadFileToS3, // Now using s3Uploader.js
  generateFileId, // Now using generateFileId.js
} = require("./audioProcessor");

const app = express();
app.use(express.json());

app.post("/twilio-call-status", async (req, res) => {
  const { RecordingSid, RecordingUrl, RecordingStatus, EncryptionDetails, CallSid } = req.body;

  if (RecordingStatus !== "completed") {
    return res.status(200).send("Recording not completed yet.");
  }

  const recordingSid = RecordingSid;
  const tempFolder = path.resolve(__dirname, "temp-files");

  // Ensure temp directory exists
  if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder);
  }

  // Define unique file paths based on recordingSid
  const encryptedFilePath = path.join(tempFolder, `${recordingSid}_encrypted.wav`);
  const decryptedFilePath = path.join(tempFolder, `${recordingSid}_decrypted.wav`);
  const convertedFilePath = path.join(tempFolder, `${recordingSid}_converted.wav`);

  try {
    // Step 1: Fetch caller number from Twilio API
    const callerNumber = await getCallerNumber(req.body.AccountSid, CallSid);
    console.log(`Caller number: ${callerNumber}`);

    // Step 2: Download the encrypted audio
    console.log("Downloading encrypted audio...");
    await downloadAudio(RecordingUrl, recordingSid);

    // Step 3: Decrypt the audio
    console.log("Decrypting audio...");
    await decryptAudio(
      encryptedFilePath,
      EncryptionDetails.encrypted_cek,
      EncryptionDetails.iv,
      process.env.TWILIO_PEM_KEY_PATH,
      decryptedFilePath
    );

    // Step 4: Convert the decrypted audio file
    console.log("Converting decrypted audio...");
    await convertAudio(decryptedFilePath, convertedFilePath);

    // Step 5: Upload converted audio to S3
    console.log("Uploading converted audio to S3...");
    const fileId = generateFileId();
    await uploadFileToS3(convertedFilePath, fileId);

    // Step 6: Clean up temp files
    console.log("Cleaning up temporary files...");
    cleanupFiles([encryptedFilePath, decryptedFilePath, convertedFilePath]);

    res.status(200).send(`File uploaded successfully. File ID: ${fileId}`);
  } catch (error) {
    console.error("Error processing Twilio call status:", error);
    res.status(500).send("An error occurred during processing.");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
