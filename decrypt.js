const fs = require('fs');
const forge = require('node-forge');

/**
 * Decrypts an encrypted audio file (.wav) using the CEK and AES256-GCM.
 * 
 * @param {string} encryptedFilePath - Path to the encrypted audio file.
 * @param {string} encryptedCek - RSA-encrypted Content Encryption Key (CEK).
 * @param {string} iv - Base64-encoded Initialization Vector for AES-GCM.
 * @param {string} pemKeyPath - Path to the PEM private key file.
 * @param {string} decryptedFilePath - Path where the decrypted audio will be saved.
 */
function decryptAudio(encryptedFilePath, encryptedCek, iv, pemKeyPath, decryptedFilePath) {
  try {
    // Step 1: Read the PEM private key
    const pemKey = fs.readFileSync(pemKeyPath, 'utf8');
    const privateKey = forge.pki.privateKeyFromPem(pemKey);

    // Step 2: Decrypt the CEK using RSA (RSAES-OAEP-SHA256-MGF1)
    const decryptedCek = privateKey.decrypt(forge.util.decode64(encryptedCek), 'RSA-OAEP', {
      md: forge.md.sha256.create(),   // Using SHA-256 for the message digest
      mgf1: {
        md: forge.md.sha256.create()  // Mask Generation Function using SHA-256
      }
    });

    // Step 3: Read the encrypted audio content (AES256-GCM encrypted)
    const encryptedAudio = fs.readFileSync(encryptedFilePath);

    // Step 4: Extract the authentication tag (usually appended at the end)
    const tagLength = 16; // GCM tag length is usually 16 bytes
    const encryptedAudioLength = encryptedAudio.length - tagLength;
    const audioData = encryptedAudio.slice(0, encryptedAudioLength); // Actual audio data (ciphertext)
    const authTag = encryptedAudio.slice(encryptedAudioLength); // Authentication tag

    // Step 5: Decrypt the audio file using AES256-GCM
    const decipher = forge.cipher.createDecipher('AES-GCM', decryptedCek);
    decipher.start({ iv: forge.util.decode64(iv), tag: forge.util.createBuffer(authTag), tagLength: 128 });
    decipher.update(forge.util.createBuffer(audioData));
    const result = decipher.finish();

    if (result) {
      const decryptedBytes = decipher.output.getBytes();
      // Step 6: Write the decrypted audio file
      fs.writeFileSync(decryptedFilePath, decryptedBytes, 'binary');
      console.log(`Decrypted audio saved to: ${decryptedFilePath}`);
    } else {
      console.error('Failed to decrypt the audio file.');
    }
  } catch (error) {
    console.error('Error during decryption:', error);
    throw error;
  }
}

module.exports = decryptAudio;
