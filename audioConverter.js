const ffmpeg = require('fluent-ffmpeg');

/**
 * Converts the input audio file to PCM 16kHz mono using ffmpeg.
 * @param {string} inputFilePath - Path to the input audio file.
 * @param {string} outputFilePath - Path where the converted file will be saved.
 * @returns {Promise<string>} - Resolves with the output file path if successful.
 */
function convertAudio(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .outputOptions([
        '-ar 16000',  // Set sample rate to 16kHz
        '-ac 1',      // Set to mono channel
        '-f wav'      // Force output to WAV format
      ])
      .on('end', () => {
        console.log('Audio conversion complete. Converted file saved at:', outputFilePath);
        resolve(outputFilePath);
      })
      .on('error', (err) => {
        console.error('Error during audio conversion:', err);
        reject(err);
      })
      .save(outputFilePath);
  });
}

module.exports = convertAudio;
