const fs = require('fs');
const forge = require('node-forge');
const path = require('path');

/**
 * Decrypts an encrypted audio file using a PEM private key.
 *
 * @param {string} encryptedFilePath - Path to the encrypted audio file.
 * @param {string} pemKeyPath - Path to the PEM private key file.
 * @param {string} decryptedFilePath - Path where the decrypted audio will be saved.
 */
function decryptAudio(encryptedFilePath, pemKeyPath, decryptedFilePath) {
  try {
    // Read the encrypted data (assuming base64 encoding)
    const encryptedData = fs.readFileSync(encryptedFilePath, 'base64');

    // Read and parse the PEM key
    const pem = fs.readFileSync(pemKeyPath, 'utf8');
    const privateKey = forge.pki.privateKeyFromPem(pem);

    // Decrypt the data
    const decryptedBytes = privateKey.decrypt(forge.util.decode64(encryptedData), 'RSA-OAEP');

    // Write the decrypted data to a file
    fs.writeFileSync(decryptedFilePath, decryptedBytes, 'binary');
    console.log(`Decrypted file saved to ${decryptedFilePath}`);
  } catch (error) {
    console.error('Error during decryption:', error);
    throw error;
  }
}

module.exports = decryptAudio;
