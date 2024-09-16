const fetch = require('node-fetch');

/**
 * Fetch encryption details from Twilio's REST API for the given recording.
 *
 * @param {string} accountSid - Twilio account SID.
 * @param {string} recordingSid - Twilio recording SID.
 * @returns {Promise<Object>} - Returns the encryption details (cek, iv) from the Twilio API.
 */
async function fetchEncryptionDetails(accountSid, recordingSid) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.json`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch encryption details: ${response.statusText}`);
  }

  const data = await response.json();
  
  const { encryption_details } = data;
  if (!encryption_details || !encryption_details.encrypted_cek || !encryption_details.iv) {
    throw new Error('Encryption details not found in the response.');
  }

  return {
    encryptedCek: encryption_details.encrypted_cek,
    iv: encryption_details.iv
  };
}

module.exports = fetchEncryptionDetails;
