const http2 = require('http2');
const aws4 = require('aws4');
const fs = require('fs');
const path = require('path');

/**
 * Streams audio to Amazon Transcribe for real-time transcription.
 * 
 * @param {string} audioFilePath - Path to the decrypted audio file.
 * @param {string} languageCode - The language code for transcription (e.g., 'en-US').
 * @param {string} sampleRate - The sample rate of the audio (e.g., 16000).
 * @param {string} region - AWS region (e.g., 'us-east-1').
 * @returns {Promise<string>} - The transcribed text.
 */
async function transcribeStreamAudio(audioFilePath, languageCode = 'en-US', sampleRate = '16000', region = 'us-east-1') {
  return new Promise((resolve, reject) => {
    // Amazon Transcribe streaming endpoint
    const endpoint = `transcribestreaming.${region}.amazonaws.com`;
    
    // Ensure AWS credentials are set in environment variables
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!awsAccessKeyId || !awsSecretAccessKey) {
      return reject(new Error('Missing AWS credentials. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your environment.'));
    }

    // Sign request using AWS Signature v4
    const requestOptions = aws4.sign({
      host: endpoint,
      method: 'POST',
      path: '/stream-transcription',
      headers: {
        'Content-Type': 'application/vnd.amazon.eventstream',
        'x-amz-target': 'com.amazonaws.transcribe.Transcribe.StartStreamTranscription',
        'x-amz-transcribe-language-code': languageCode,
        'x-amz-transcribe-sample-rate': sampleRate,
        'transfer-encoding': 'chunked',
      },
      service: 'transcribestreaming',
      region,
    }, {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    });

    // Establish HTTP/2 connection
    const client = http2.connect(`https://${endpoint}`);
    const req = client.request(requestOptions.headers);

    // Buffer to accumulate the transcript
    let transcriptBuffer = '';

    // Stream the audio data
    const audioStream = fs.createReadStream(audioFilePath);
    audioStream.on('data', (chunk) => {
      req.write(chunk);
    });
    audioStream.on('end', () => {
      req.end();
    });

    // Process the transcription stream
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      transcriptBuffer += chunk; // Append the transcribed data to the buffer
    });

    req.on('end', () => {
      client.close();
      resolve(transcriptBuffer); // Return the final transcript
    });

    req.on('error', (err) => {
      client.close();
      reject(err);
    });
  });
}

module.exports = transcribeStreamAudio;
