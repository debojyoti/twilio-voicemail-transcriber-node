const fetch = require("node-fetch");
const fs = require("fs");

/**
 * Fetches the caller's number from Twilio Call Events API.
 *
 * @param {string} accountSid - Twilio account SID.
 * @param {string} callSid - Twilio call SID.
 * @returns {Promise<string>} - The caller's phone number.
 */
async function getCallerNumber(accountSid, callSid) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}/Events.json`;
  const auth = `${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(auth).toString("base64")}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch caller number: ${response.statusText}`);
  }

  const data = await response.json();
  const fromNumber = data.events[0].request.parameters.from;
  return fromNumber;
}

/**
 * Downloads the audio file from a URL and saves it to the specified output path.
 *
 * @param {string} url - The URL of the audio file.
 * @param {string} outputPath - The local path where the file should be saved.
 * @returns {Promise<void>}
 */
async function downloadAudio(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download audio file: ${response.statusText}`);
  }

  const fileStream = fs.createWriteStream(outputPath);
  return new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

/**
 * Cleans up local files by deleting them after the process completes.
 *
 * @param {Array<string>} filePaths - Array of file paths to delete.
 */
function cleanupFiles(filePaths) {
  filePaths.forEach((filePath) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${filePath}`, err);
      } else {
        console.log(`Deleted file: ${filePath}`);
      }
    });
  });
}

module.exports = {
  getCallerNumber,
  downloadAudio,
  cleanupFiles,
};
