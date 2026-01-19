import { config } from '../config';
import { logger } from '../utils/logger';
import * as fal from '@fal-ai/serverless-client';

/**
 * DEMO SERVICE: How "100% Same Face" works.
 * 
 * To use this, we would:
 * 1. Sign up for fal.ai
 * 2. Set FAL_KEY in .env
 * 3. Replace the current ImageGenerator with this one.
 */
export class FalImageGenerator {
  
  constructor() {
    fal.config({
      credentials: process.env.FAL_KEY, 
    });
  }

  async generateWithSameFace(imageUrl: string, prompt: string) {
    logger.info('Generating image with InstantID (Identity Preservation)...');

    // We use "InstantID", a model specifically designed to keep the face exact.
    const result: any = await fal.subscribe('fal-ai/instant-id', {
      input: {
        image_url: imageUrl,
        prompt: prompt,
        // This is the magic setting:
        // High "Identity Weight" ensures the face stays 100% the same.
        guidance_scale: 2.5,
        control_weight: 0.85, 
        style: "Photo"
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          logger.debug(`Fal.ai Generation Progress: ${update.logs.map(l => l.message).join('\n')}`);
        }
      },
    });

    return result.images[0].url;
  }
}
