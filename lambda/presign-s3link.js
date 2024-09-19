const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize S3 client
const s3 = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  const bucketName = process.env.S3_BUCKET_NAME;
  const fileId = event.queryStringParameters.id;  // Get the file ID from the query string
  const fileKey = `${fileId}.wav`;  // The S3 key of the file
  
  // Set the presigned URL expiration (30 minutes)
  const expirationInSeconds = 30 * 60;

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    // Generate the presigned URL
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: expirationInSeconds });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        presignedUrl: presignedUrl,
      }),
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error generating presigned URL',
        error: error.message,
      }),
    };
  }
};

// Environment Variables for Lambda:

// Make sure your Lambda function has the following environment variables set:
// - `AWS_REGION`: Your AWS region (e.g., `us-east-1`).
// - `S3_BUCKET_NAME`: The name of the S3 bucket where the files are stored.