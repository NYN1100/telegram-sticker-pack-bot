import 'dotenv/config';
import { ImageGenerator } from './services/imageGenerator';
import { ImageProcessor } from './services/imageProcessor';
import { config } from './config';
import path from 'path';
import fs from 'fs';
import { logger } from './utils/logger';

async function run() {
  logger.info('Starting reproduction script...');

  try {
    // 1. Find an input image
    const tempDir = path.join(process.cwd(), 'tmp');
    const files = fs.readdirSync(tempDir);
    const inputImage = files.find(f => f.startsWith('input_') && f.endsWith('.jpg'));

    if (!inputImage) {
      logger.error('No input image found in tmp/');
      return;
    }

    const inputPath = path.join(tempDir, inputImage);
    logger.info(`Using input image: ${inputPath}`);

    // 2. Test ImageGenerator
    logger.info('Testing ImageGenerator...');
    const generator = new ImageGenerator();
    // Generate only 2 variations to be fast
    const variations = await generator.generateVariations(inputPath, 2);
    logger.info(`Generated ${variations.length} variations:`, variations);

    // 3. Test ImageProcessor
    logger.info('Testing ImageProcessor...');
    const processor = new ImageProcessor();
    const stickers = await processor.processStickers(variations, config.greetings.slice(0, 2));
    logger.info(`Processed ${stickers.length} stickers:`, stickers);

    logger.info('SUCCESS: Image pipeline is working correctly.');
    
  } catch (error) {
    logger.error('FAILURE: Error in reproduction script:', error);
  }
}

run();
