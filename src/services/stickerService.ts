import { Telegraf } from 'telegraf';
import { logger } from '../utils/logger';
import { Input } from 'telegraf';

interface StickerFile {
  path: string;
  emoji: string;
}

export class StickerService {
  private bot: Telegraf;

  constructor(bot: Telegraf) {
    this.bot = bot;
  }

  /**
   * Create a new sticker set for the user
   * @param userId Telegram user ID
   * @param username Telegram username
   * @param stickerPaths Array of paths to sticker files (WebP format)
   * @returns Sticker set name
   */
  async createStickerSet(
    userId: number,
    username: string,
    stickerPaths: string[]
  ): Promise<string> {
    const stickerSetName = this.generateStickerSetName(userId);
    const title = `AI Stickers by @${username || userId}`;
    
    logger.info(`Creating sticker set: ${stickerSetName}`);

    try {
      // 1. Upload stickers first to get file_ids
      // This is more robust than sending files directly in createNewStickerSet
      const stickersWithIds: { fileId: string; emoji: string }[] = [];

      for (let i = 0; i < stickerPaths.length; i++) {
        const stickerPath = stickerPaths[i];
        const emoji = this.getEmojiForIndex(i);
        
        try {
          logger.debug(`Uploading sticker ${i + 1}/${stickerPaths.length}...`);
          const file = await this.bot.telegram.uploadStickerFile(
            userId, 
            Input.fromLocalFile(stickerPath),
            'static'
          );
          
          stickersWithIds.push({
            fileId: file.file_id,
            emoji
          });
        } catch (uploadError) {
          logger.error(`Failed to upload sticker ${i + 1}:`, uploadError);
          // Continue with other stickers if one fails, or throw? 
          // Better to throw as a incomplete pack is not ideal
          throw uploadError;
        }
      }

      // 2. Create input stickers array using file_ids
      const inputStickers = stickersWithIds.map(s => ({
        sticker: s.fileId,
        emoji_list: [s.emoji]
      }));

      // 3. Create the sticker set
      logger.info(`Creating set ${stickerSetName} with ${inputStickers.length} stickers`);
      await this.bot.telegram.createNewStickerSet(
        userId,
        stickerSetName,
        title,
        {
          stickers: inputStickers,
          sticker_format: 'static'
        }
      );

      logger.info(`Successfully created sticker set: ${stickerSetName}`);
      return stickerSetName;
    } catch (error) {
      logger.error('Error creating sticker set:', error);
      throw new Error('Failed to create sticker set. Please try again.');
    }
  }

  /**
   * Generate a unique sticker set name for the user
   */
  private generateStickerSetName(userId: number): string {
    const timestamp = Date.now();
    const botUsername = this.bot.botInfo?.username || 'bot';
    
    // Telegram sticker set names must end with "_by_<bot_username>"
    // and can only contain letters, digits, and underscores
    const safeName = `ai_stickers_${userId}_${timestamp}_by_${botUsername}`;
    
    return safeName;
  }

  /**
   * Get emoji for sticker based on index
   */
  private getEmojiForIndex(index: number): string {
    const emojis = [
      '👋', // Assalomu alaykum (greeting)
      '🙏', // Vaaalaykum assalom (response)
      '🙏', // Rahmat (thank you)
      '😊', // Yaxshimisiz? (how are you)
      '👋', // Xayr (goodbye)
      '✅', // Ha (yes)
      '❌', // Yo'q (no)
      '🙏', // Kechirasiz (sorry)
    ];
    
    return emojis[index % emojis.length];
  }

  /**
   * Get the URL for a sticker set
   */
  getStickerSetUrl(stickerSetName: string): string {
    return `https://t.me/addstickers/${stickerSetName}`;
  }
}
