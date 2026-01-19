
import { ImageGenerator } from './services/imageGenerator';
import * as path from 'path';
import * as fs from 'fs';

async function verifyTextOnlyMode() {
  console.log('Verifying Text Overlay Mode (No AI)...');

  // Create a dummy input image
  const inputDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir, { recursive: true });
  
  const testInputPath = path.join(inputDir, 'test_input_text_only.txt');
  fs.writeFileSync(testInputPath, 'Dummy Image Content'); // Just a file to copy

  const generator = new ImageGenerator();
  
  try {
    const results = await generator.generateVariations(testInputPath, 3);
    
    console.log(`Generated ${results.length} results.`);
    
    // Verify results exist and are copies
    let success = true;
    for (const resPath of results) {
        if (!fs.existsSync(resPath)) {
            console.error(`Missing output file: ${resPath}`);
            success = false;
        } else {
            const content = fs.readFileSync(resPath, 'utf-8');
            if (content !== 'Dummy Image Content') {
                console.error(`Content mismatch in ${resPath}`);
                success = false;
            }
        }
    }

    if (success) {
        console.log('SUCCESS: All outputs are correct copies of the input.');
    } else {
        console.error('FAILURE: Verification failed.');
    }

  } catch (error) {
    console.error('Error during verification:', error);
  }
}

verifyTextOnlyMode();
