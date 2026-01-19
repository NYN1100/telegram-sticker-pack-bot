import 'dotenv/config';
import { HfInference } from '@huggingface/inference';
import * as fs from 'fs';
import * as path from 'path';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Candidates for Free Face Swap Spaces
// Note: Spaces API usually follows a specific pattern or uses the Gradio client.
// We will try raw fetch to the space's API endpoint if standard inference doesn't work.

const SPACE_ID = 'tonic1/face-swap'; // Example candidate
const SPACE_ID_2 = 'felixrosberg/face-swap';

async function testFaceSwap() {
  console.log('Testing Free Face Swap Spaces...');
  
  const sourcePath = path.join(process.cwd(), 'tmp', 'test_input.jpg'); // User Face
  const targetPath = path.join(process.cwd(), 'tmp', 'test_target.jpg'); // AI Body

  if (!fs.existsSync(sourcePath) || !fs.existsSync(targetPath)) {
    console.error('Missing test images in tmp/');
    return;
  }

  const sourceBuffer = fs.readFileSync(sourcePath);
  const targetBuffer = fs.readFileSync(targetPath);
  
  // Method 1: Try accessing the Space via Inference API (if supported)
  console.log(`1. Testing Space: ${SPACE_ID} via Inference Wrapper`);
  try {
     // This is a guess - many spaces don't support the standard Inference API directly
     // and need the @gradio/client or raw API calls to /api/predict
    const res = await hf.request({
      model: SPACE_ID,
      inputs: {
        source_image: sourceBuffer.toString('base64'),
        target_image: targetBuffer.toString('base64')
      }
    });
    console.log('Success via Inference Wrapper!', res);
  } catch (e: any) {
    console.error('Failed Inference Wrapper:', e.message);
  }

  // Method 2: Raw Fetch to Gradio API endpoint
  console.log('2. Testing via Gradio API endpoint...');
  const spacesToTest = [
    'https://felixrosberg-face-swap.hf.space/api/predict',
    'https://felixrosberg-face-swap.hf.space/run/predict',
    'https://t-h-insightface-swap.hf.space/api/predict',
    'https://t-h-insightface-swap.hf.space/run/predict'
  ];

  for (const spaceUrl of spacesToTest) {
    console.log(`Testing URL: ${spaceUrl}`);
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(spaceUrl, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        },
        body: JSON.stringify({
          data: [
            `data:image/jpeg;base64,${sourceBuffer.toString('base64')}`,
            `data:image/jpeg;base64,${targetBuffer.toString('base64')}`,
          ]
        })
      });

      if (response.ok) {
          const result = await response.json();
          console.log(`SUCCESS via ${spaceUrl}!`, result);
          break; // Found one!
      } else {
          console.log(`Failed ${spaceUrl}:`, response.status, response.statusText);
      }
    } catch (e: any) {
      console.error(`Error connecting to ${spaceUrl}:`, e.message);
    }
  }
}

testFaceSwap();
