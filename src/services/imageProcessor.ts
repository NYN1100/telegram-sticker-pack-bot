import sharp from 'sharp';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { config } from '../config';
import { logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';

export class ImageProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'tmp');
    
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Process images: resize, add text overlay, convert to WebP
   * @param imagePaths Array of image paths
   * @param texts Array of texts to overlay (one per image)
   * @returns Array of processed sticker paths
   */
  async processStickers(imagePaths: string[], texts: string[]): Promise<string[]> {
    logger.info(`Processing ${imagePaths.length} stickers...`);
    
    const processedPaths: string[] = [];

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const text = texts[i] || '';

      try {
        logger.debug(`Processing sticker ${i + 1}: adding text "${text}"`);
        
        // Step 1: Resize image to sticker size
        const resizedPath = await this.resizeImage(imagePath);
        
        // Step 2: Add text overlay
        const withTextPath = await this.addTextOverlay(resizedPath, text);
        
        // Step 3: Convert to WebP format
        const finalPath = await this.convertToWebP(withTextPath);
        
        processedPaths.push(finalPath);
        
        // Cleanup intermediate files
        if (resizedPath !== imagePath) fs.unlinkSync(resizedPath);
        if (withTextPath !== resizedPath) fs.unlinkSync(withTextPath);
        
        logger.debug(`Processed sticker ${i + 1} saved to ${finalPath}`);
      } catch (error) {
        logger.error(`Error processing sticker ${i + 1}:`, error);
        throw error;
      }
    }

    logger.info(`Successfully processed ${processedPaths.length} stickers`);
    return processedPaths;
  }

  /**
   * Resize image to sticker dimensions (512x512)
   */
  private async resizeImage(imagePath: string): Promise<string> {
    const outputPath = path.join(this.tempDir, `resized_${Date.now()}_${path.basename(imagePath)}`);
    
    await sharp(imagePath)
      .resize(config.stickerSize, config.stickerSize, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(outputPath);
    
    return outputPath;
  }

  /**
   * Add text overlay to image using canvas
   */
  private async addTextOverlay(imagePath: string, text: string): Promise<string> {
    const outputPath = path.join(this.tempDir, `text_${Date.now()}_${path.basename(imagePath)}`);
    
    // Load the image
    const image = await loadImage(imagePath);
    
    // Create canvas
    const canvas = createCanvas(config.stickerSize, config.stickerSize);
    const ctx = canvas.getContext('2d');
    
    // Draw the image
    ctx.drawImage(image, 0, 0, config.stickerSize, config.stickerSize);
    
    // Configure text
    const fontSize = config.textOverlay.fontSize;
    ctx.font = `bold ${fontSize}px ${config.textOverlay.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate text position
    const x = config.stickerSize / 2;
    let y: number;
    
    switch (config.textOverlay.position) {
      case 'top':
        y = fontSize + config.textOverlay.padding;
        break;
      case 'center':
        y = config.stickerSize / 2;
        break;
      case 'bottom':
      default:
        y = config.stickerSize - fontSize - config.textOverlay.padding;
        break;
    }
    
    // Draw text with stroke (outline)
    ctx.strokeStyle = config.textOverlay.strokeColor;
    ctx.lineWidth = config.textOverlay.strokeWidth;
    ctx.strokeText(text, x, y);
    
    // Draw text fill
    ctx.fillStyle = config.textOverlay.fontColor;
    ctx.fillText(text, x, y);
    
    // Save to file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  }

  /**
   * Convert image to WebP format for Telegram stickers
   */
  private async convertToWebP(imagePath: string): Promise<string> {
    const outputPath = path.join(
      this.tempDir,
      `sticker_${Date.now()}_${path.basename(imagePath, path.extname(imagePath))}.webp`
    );
    
    await sharp(imagePath)
      .webp({ quality: 90 })
      .toFile(outputPath);
    
    return outputPath;
  }

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
}
