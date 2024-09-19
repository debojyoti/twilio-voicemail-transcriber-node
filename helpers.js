const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

/**
 * Fetches the caller's number from Twilio Call Events API.
 *
 * @param {string} accountSid - Twilio account SID.
 * @param {string} callSid - Twilio call SID.
 * @returns {Promise<string>} - The caller's phone number.
 */
async function getCallerNumber(accountSid, callSid) {
  console.log('accountSid, callSid :>> ', accountSid, callSid);
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
 * @param {string} recordingSid - The unique Twilio recording SID.
 * @returns {Promise<string>} - Path to the downloaded file.
 */
async function downloadAudio(url, recordingSid) {
  // Ensure the /temp-files directory exists
  const tempDir = path.resolve(__dirname, "temp-files");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const outputPath = path.join(tempDir, `${recordingSid}_encrypted.wav`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download audio file: ${response.statusText}`);
  }

  const fileStream = fs.createWriteStream(outputPath);
  return new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on("error", reject);
    fileStream.on("finish", () => resolve(outputPath));
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
