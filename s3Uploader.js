const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const fs = require('fs');

// Initialize S3 client
const s3 = new S3Client({ region: process.env.AWS_REGION });

// Function to generate a unique file ID
function generateFileId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Uploads a file to S3 bucket.
 * @param {string} filePath - Path to the file being uploaded.
 * @param {string} fileId - Unique file identifier.
 * @returns {Promise}
 */
async function uploadFileToS3(filePath, fileId) {
  const fileStream = fs.createReadStream(filePath);
  const bucketName = process.env.S3_BUCKET_NAME;

  const uploadParams = {
    Bucket: bucketName,
    Key: `${fileId}.wav`, // The file will be saved as <fileId>.wav
    Body: fileStream,
  };

  try {
    await s3.send(new PutObjectCommand(uploadParams));
    console.log('File uploaded to S3 with ID:', fileId);
  } catch (err) {
    console.error('Error uploading file to S3:', err);
    throw err;
  }
}

module.exports = { uploadFileToS3, generateFileId };
