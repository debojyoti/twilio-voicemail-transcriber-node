const fs = require("fs");
const path = require("path");

/**
 * Logs the public URL and transcript to a JSON file and the console.
 *
 * @param {string} publicUrl - Public URL of the uploaded audio file.
 * @param {string} transcript - Transcribed text.
 * @param {string} logFilePath - Path to the log file.
 */
function logResult(publicUrl, transcript, logFilePath) {
  const logEntry = {
    publicUrl,
    transcript,
    timestamp: new Date().toISOString(),
  };

  const absoluteLogPath = path.resolve(logFilePath);

  // Read existing logs
  let logs = [];
  if (fs.existsSync(absoluteLogPath)) {
    const existingData = fs.readFileSync(absoluteLogPath, "utf8");
    if (existingData) {
      try {
        logs = JSON.parse(existingData);
      } catch (error) {
        console.error("Error parsing existing log file:", error);
      }
    }
  }

  // Append new log entry
  logs.push(logEntry);

  // Write updated logs back to the file
  try {
    fs.writeFileSync(absoluteLogPath, JSON.stringify(logs, null, 2), "utf8");
    console.log("Log entry added to logs.json");
  } catch (error) {
    console.error("Error writing to log file:", error);
  }

  // Also log to the console
  console.log("Public URL:", publicUrl);
  console.log("Transcript:", transcript);
}

module.exports = logResult;
