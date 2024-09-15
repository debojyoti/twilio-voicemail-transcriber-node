const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const fetch = require('node-fetch'); // Ensure node-fetch is installed

/**
 * Starts a transcription job for the given S3 URI.
 *
 * @param {string} s3Uri - S3 URI of the audio file (e.g., s3://bucket-name/file.wav).
 * @param {string} jobName - Unique name for the transcription job.
 * @param {string} region - AWS region.
 * @param {string} languageCode - Language code (default: 'en-US').
 * @param {string} outputBucket - S3 bucket where the transcription output will be stored.
 * @returns {Promise<void>}
 */
async function transcribeAudio(s3Uri, jobName, region = 'us-east-1', languageCode = 'en-US', outputBucket) {
  const transcribeClient = new TranscribeClient({ region });

  const params = {
    TranscriptionJobName: jobName,
    LanguageCode: languageCode,
    Media: {
      MediaFileUri: s3Uri,
    },
    OutputBucketName: outputBucket, // Replace with your output bucket
    // Optionally, specify settings like vocabulary name, etc.
  };

  const command = new StartTranscriptionJobCommand(params);

  try {
    await transcribeClient.send(command);
    console.log(`Transcription job "${jobName}" started.`);
  } catch (error) {
    console.error('Error starting transcription job:', error);
    throw error;
  }
}

/**
 * Retrieves the transcription result once the job is completed.
 *
 * @param {string} jobName - Name of the transcription job.
 * @param {string} region - AWS region.
 * @returns {Promise<string|null>} - The transcription text or null if not completed.
 */
async function getTranscriptionResult(jobName, region = 'us-east-1') {
  const transcribeClient = new TranscribeClient({ region });

  const command = new GetTranscriptionJobCommand({ TranscriptionJobName: jobName });

  try {
    const data = await transcribeClient.send(command);
    const jobStatus = data.TranscriptionJob.TranscriptionJobStatus;

    if (jobStatus === 'COMPLETED') {
      const transcriptUri = data.TranscriptionJob.Transcript.TranscriptFileUri;
      const transcriptResponse = await fetch(transcriptUri);
      const transcriptData = await transcriptResponse.json();
      const transcriptText = transcriptData.results.transcripts[0].transcript;
      console.log('Transcription completed.');
      return transcriptText;
    } else if (jobStatus === 'FAILED') {
      console.error('Transcription job failed.');
      return null;
    } else {
      console.log(`Transcription job status: ${jobStatus}`);
      return null;
    }
  } catch (error) {
    console.error('Error retrieving transcription result:', error);
    throw error;
  }
}

module.exports = { transcribeAudio, getTranscriptionResult };
