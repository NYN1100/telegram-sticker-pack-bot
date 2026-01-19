// // import { HfInference } from '@huggingface/inference';
import { config } from '../config';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export class ImageGenerator {
  // private hf: HfInference;
  private tempDir: string;

  constructor() {
    // this.hf = new HfInference(config.huggingFaceApiKey);
    this.tempDir = path.join(process.cwd(), 'tmp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Generate AI variations of the input image
   * @param inputImagePath Path to the user's uploaded image
   * @param numVariations Number of variations to generate
   * @returns Array of paths to generated images
   */
  async generateVariations(
    inputImagePath: string,
    numVariations: number = config.greetings.length
  ): Promise<string[]> {
    const generatedPaths: string[] = [];
    
    logger.info(`Generating ${numVariations} variations (Text Overlay Mode - AI Bypassed)...`);

    for (let i = 0; i < numVariations; i++) {
      try {
        // In Text Overlay Mode, we simply create copies of the original image.
        // The "variation" is just the text that will be overlaid later.
        const outputPath = path.join(this.tempDir, `overlay_mode_${i}_${Date.now()}.png`);
        
        fs.copyFileSync(inputImagePath, outputPath);
        
        generatedPaths.push(outputPath);
        logger.debug(`Created copy ${i + 1} for overlay: ${outputPath}`);
        
      } catch (error) {
        logger.error(`Error processing copy ${i + 1}:`, error);
        // Fallback or skip
      }
    }

    logger.info(`Successfully prepared ${generatedPaths.length} images for text overlay`);
    return generatedPaths;
  }

  /* Unused in Text Overlay Mode
  private getVariationPrompts(count: number): string[] {
    const basePrompts = [
      'professional portrait of a person wearing a sharp navy blue suit, modern office background, cinematic lighting, photorealistic, 8k',
      'person working at a desk wearing a charcoal grey suit, focused expression, busy corporate office environment, high quality',
      'person standing confidently in a glass-walled office wearing a black suit, city skyline view behind, executive style, masterpiece',
      'close-up portrait of a person in a tuxedo suit, elegant atmosphere, blurred office background, soft lighting, professional photo',
      'person giving a presentation in a meeting room wearing a tailored beige suit, professional stance, corporate setting, detailed',
      'person walking down a modern office corridor wearing a pinstripe suit, dynamic pose, bright lighting, business success',
      'relaxed person sitting in an office lounge wearing a business casual suit, holding a coffee, warm lighting, friendly atmosphere',
      'person signing documents at a conference table wearing a dark green suit, serious professional look, detailed office texture'
    ];

    // Repeat prompts if we need more than available
    const prompts: string[] = [];
    for (let i = 0; i < count; i++) {
      prompts.push(basePrompts[i % basePrompts.length]);
    }

    return prompts;
  }
  */

  /**
   * Cleanup temporary files
   */
  cleanup(filePaths: string[]): void {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.debug(`Cleaned up file: ${filePath}`);
        }
      } catch (error) {
        logger.warn(`Failed to cleanup file ${filePath}:`, error);
      }
    });
  }

  /* Unused in Text Overlay Mode
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  */
}
