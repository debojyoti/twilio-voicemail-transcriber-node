require("dotenv").config(); // Load environment variables
const express = require("express");
const path = require("path");
const fs = require("fs");
const { getCallerNumber, downloadAudio, cleanupFiles } = require("./helpers");
const {
  decryptAudio,
  convertAudio,
  transcribeStreamAudio,
  uploadFileToS3, // Now using s3Uploader.js
  generateFileId,
} = require("./audioProcessor");
const sgMail = require('@sendgrid/mail'); // Import SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Set SendGrid API Key

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
    const s3Url = await uploadFileToS3(convertedFilePath, fileId);
    console.log(`File uploaded to S3. URL: ${s3Url}`);

    // Step 6: Perform transcription of the audio
    console.log("Starting transcription...");
    const transcriptionText = await transcribeStreamAudio(convertedFilePath, "en-US", 16000);
    console.log("Transcription complete:", transcriptionText);

    // Step 7: Clean up temp files
    console.log("Cleaning up temporary files...");
    cleanupFiles([encryptedFilePath, decryptedFilePath, convertedFilePath]);

    // Step 8: Send email using SendGrid
    console.log("Sending email notification...");
    const frontendUrl = `${process.env.FRONTEND_URL}/?id=${fileId}`;
    const emailSubject = `${new Date().toISOString()} - New Voicemail from: ${callerNumber}`;
    const emailContent = `
      A new Voicemail has been received:\n
      Transcription is: ${transcriptionText}\n
      Recording URL is: ${frontendUrl}\n
      Reason for call: ChildCare Services in WA, CA, IL, MA and CT
    `;

    const msg = {
      to: process.env.SENDGRID_TO_EMAIL, // Recipient email
      from: process.env.SENDGRID_FROM_EMAIL, // Verified sender email
      subject: emailSubject,
      text: emailContent,
    };

    await sgMail.send(msg);
    console.log("Email sent successfully.");

    // Send response back to the webhook
    res.status(200).send(`File uploaded and email sent successfully. File ID: ${fileId}`);
  } catch (error) {
    console.error("Error processing Twilio call status:", error);
    res.status(500).send("An error occurred during processing.");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
