import 'dotenv/config';
import { HfInference } from '@huggingface/inference';
import * as fs from 'fs';
import * as path from 'path';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
const model = 'stabilityai/stable-diffusion-xl-base-1.0'; 
const inputImage = path.join(process.cwd(), 'tmp', 'test_input.jpg');

async function testGeneration() {
  console.log(`Testing with model: ${model}`);
  
  if (!fs.existsSync(inputImage)) {
    console.error(`Please put a test image at ${inputImage}`);
    return;
  }

  const buffer = fs.readFileSync(inputImage);
  const blob = new Blob([buffer]);

  // 0. Sanity Check with GPT2
  console.log('0. Testing GPT2 (Text Generation)...');
  try {
    const res = await hf.textGeneration({
      model: 'gpt2',
      inputs: 'Hello world'
    });
    console.log('SUCCESS with GPT2:', res);
  } catch (e) {
    console.error('FAILED with GPT2:', e.message || e);
  }

  // 1. Test via Library
  console.log('1. Testing Library (imageToImage)...');
  try {
    const res = await hf.imageToImage({
      model,
      inputs: blob,
      parameters: {
        prompt: "make him wear a suit",
        strength: 0.8
      }
    });
    console.log('SUCCESS with Library');
  } catch (e) {
    console.error('FAILED with Library:', e.message || e);
  }

  // 2. Test via Raw Fetch (Manual API Call)
  console.log('2. Testing Raw Fetch to GPT2...');
  try {
    const fetch = (await import('node-fetch')).default;
    // Trying /models/ path (simplest)
    const url = `https://router.huggingface.co/models/gpt2`;
    console.log(`Connecting to: ${url}`);
    
    const payload = { inputs: "Hello my name is" };

    const response = await fetch(
      url,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
          'x-use-cache': 'false'
        },
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('SUCCESS with Raw Fetch to GPT2:', result);
  } catch (e) {
    console.error('FAILED with Raw Fetch:', e.message || e);
  }
}

testGeneration();
