const { TranscribeStreamingClient, StartStreamTranscriptionCommand } = require("@aws-sdk/client-transcribe-streaming");
const fs = require("fs");

// Initialize the AWS TranscribeStreamingClient
const transcribeClient = new TranscribeStreamingClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Streams a local .wav file to Amazon Transcribe Streaming service.
 */
async function transcribeStreamAudio(audioFilePath, languageCode = "en-US", sampleRate = 16000) {
  return new Promise((resolve, reject) => {
    // Create a readable stream from the audio file
    const audioStream = fs.createReadStream(audioFilePath, { highWaterMark: 32000 });  // Limit chunk size to 32 KB

    // Set up parameters for the transcription job
    const params = {
      LanguageCode: languageCode,
      MediaSampleRateHertz: sampleRate,
      MediaEncoding: 'pcm', // Amazon Transcribe expects PCM encoding
      AudioStream: {
        async *[Symbol.asyncIterator]() {
          for await (const chunk of audioStream) {
            yield { AudioEvent: { AudioChunk: chunk } };
          }
        },
      },
    };

    const command = new StartStreamTranscriptionCommand(params);

    let transcriptBuffer = '';

    // Capture transcription results as they come in
    transcribeClient.send(command)
      .then(async (response) => {
        for await (const event of response.TranscriptResultStream) {
          const results = event.TranscriptEvent.Transcript.Results;
          if (results.length > 0 && results[0].Alternatives.length > 0) {
            const transcript = results[0].Alternatives[0].Transcript;

            // Check if the result is final (not partial)
            if (!results[0].IsPartial) {
              transcriptBuffer += transcript + ' ';
              console.log('Final transcript portion:', transcript.trim());
            } else {
              console.log('Partial transcript (not final):', transcript.trim());
            }
          }
        }

        console.log('Transcription complete.');
        resolve(transcriptBuffer.trim());

      }).catch((err) => {
        console.error('Transcription error:', err);
        reject(err);
      });
  });
}


module.exports = transcribeStreamAudio;
