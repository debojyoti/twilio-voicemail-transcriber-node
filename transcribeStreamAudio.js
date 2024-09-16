const http2 = require("http2");
const aws4 = require("aws4");
const fs = require("fs");

/**
 * Streams a local .wav file to Amazon Transcribe Streaming service.
 */
async function transcribeStreamAudio(
  audioFilePath,
  languageCode = "en-US",
  sampleRate = "16000",
  region = "us-east-1"
) {
  return new Promise((resolve, reject) => {
    const endpoint = `transcribestreaming.${region}.amazonaws.com`;

    // Prepare the request options
    const requestOptions = {
      host: endpoint,
      method: "POST",
      path: "/stream-transcription",
      service: "transcribestreaming",
      headers: {
        "Content-Type": "application/vnd.amazon.eventstream",
        "x-amz-target": "com.amazonaws.transcribe.Transcribe.StartStreamTranscription",
        "x-amz-transcribe-language-code": languageCode,
        "x-amz-transcribe-sample-rate": sampleRate,
        "x-amz-content-sha256": "STREAMING-AWS4-HMAC-SHA256-EVENTS",
        // Remove "Transfer-Encoding"
      },
      region: region,
    };

    // Sign the request with AWS credentials
    aws4.sign(requestOptions);

    // Log the signed request options for debugging
    console.log("Signed Request Options:", requestOptions);

    // Establish an HTTP/2 connection to Amazon Transcribe Streaming
    const client = http2.connect(`https://${endpoint}`);
    console.log("Connected to AWS Transcribe Streaming service.");

    // Start the transcription request
    const req = client.request(requestOptions.headers);
    console.log("Request to Transcribe service initiated.");

    // Buffer to accumulate transcription results
    let transcriptBuffer = "";

    // Capture the transcription results as they come in
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      console.log("Received transcription chunk.");
      transcriptBuffer += chunk;
    });

    req.on("end", () => {
      console.log("Transcription complete, request ended.");
      client.close();
      resolve(transcriptBuffer); // Return the final transcription result
    });

    req.on("error", (err) => {
      console.error("Request error:", err.message);
      client.close();
      reject(`Error with transcription request: ${err.message}`);
    });

    // Stream the audio file chunk by chunk to AWS Transcribe
    const audioStream = fs.createReadStream(audioFilePath);

    console.log("Audio stream opened.");

    audioStream.on("data", (chunk) => {
      console.log("Writing audio chunk...");
      if (!req.closed && !req.destroyed) {
        req.write(chunk); // Stream each chunk to AWS Transcribe
      }
    });

    audioStream.on("end", () => {
      console.log("Audio stream ended. Ending transcription request.");
      req.end(); // Close the request after all chunks have been streamed
    });

    // Handle audio stream errors
    audioStream.on("error", (err) => {
      console.error("Audio stream error:", err.message);
      client.close();
      reject(`Error reading audio file: ${err.message}`);
    });
  });
}

module.exports = transcribeStreamAudio;
