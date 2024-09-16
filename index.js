require('dotenv').config(); // Load environment variables
const path = require('path');
const fetchEncryptionDetails = require('./twilioApi');
const decryptAudio = require('./decrypt');

// Read configuration from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const recordingSid = process.env.TWILIO_RECORDING_SID;
const encryptedFilePath = path.resolve(process.env.ENCRYPTED_AUDIO_PATH);
const pemKeyPath = path.resolve(process.env.TWILIO_PEM_KEY_PATH);
const decryptedFilePath = path.resolve(process.env.DECRYPTED_AUDIO_PATH);

(async () => {
  try {
    // Step 1: Fetch encryption details from Twilio (CEK and IV)
    const { encryptedCek, iv } = await fetchEncryptionDetails(accountSid, recordingSid);
    
    // Step 2: Decrypt the audio file using the fetched encryption details
    decryptAudio(encryptedFilePath, encryptedCek, iv, pemKeyPath, decryptedFilePath);
  } catch (error) {
    console.error('An error occurred:', error);
  }
})();
