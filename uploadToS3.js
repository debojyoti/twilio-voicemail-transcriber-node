const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Uploads a file to an S3 bucket and returns the public URL.
 *
 * @param {string} filePath - Path to the file to upload.
 * @param {string} bucketName - Name of the S3 bucket.
 * @param {string} region - AWS region where the bucket is located.
 * @returns {Promise<string>} - Public URL of the uploaded file.
 */
async function uploadToS3(filePath, bucketName, region = 'us-east-1') {
  const s3Client = new S3Client({ region });

  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileContent,
    ACL: 'public-read', // Makes the file publicly accessible
    ContentType: 'audio/wav', // Adjust based on your audio format
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${encodeURIComponent(fileName)}`;
    console.log(`File uploaded successfully. ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

module.exports = uploadToS3;
