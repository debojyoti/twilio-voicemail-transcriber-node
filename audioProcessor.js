const decryptAudio = require("./decrypt");
const convertAudio = require("./audioConverter");
const transcribeStreamAudio = require("./transcribeStreamAudio");
const { uploadFileToS3, generateFileId } = require("./s3Uploader"); // Replaced uploadToS3.js with s3Uploader.js

module.exports = {
  decryptAudio,
  convertAudio,
  transcribeStreamAudio,
  uploadFileToS3, // Use the new S3 upload function from s3Uploader.js
  generateFileId,
};
