import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { ImageGenerator } from './services/imageGenerator';
import { ImageProcessor } from './services/imageProcessor';
import { StickerService } from './services/stickerService';
import { QueueService, StickerJobResult } from './services/queueService';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Validate configuration
validateConfig();

// Initialize bot
const bot = new Telegraf(config.telegramToken);

// Initialize services
const imageGenerator = new ImageGenerator();
const imageProcessor = new ImageProcessor();
const stickerService = new StickerService(bot);
const queueService = new QueueService();

// Temporary directory for downloads
const tempDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Health check server for Render/Railway
import http from 'http';
const port = process.env.PORT || 3000;
http.createServer((_req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
  // Log every few pings to avoid spam, or just log all for debugging
  logger.debug('Health check ping received');
}).listen(port, () => {
  logger.info(`Health check server listening on port ${port}`);
});

/**
 * Start command handler
 */
bot.command('start', async (ctx) => {
  const welcomeMessage = `
🎨 *AI Sticker Botga xush kelibsiz!*

Menga rasm yuboring va men sizga o'zbekcha tabriklar bilan shaxsiy stikerlar to'plamini yasab beraman! 🇺🇿

Har bir to'plam quyidagi matnli 10 ta stikerni o'z ichiga oladi:
• Assalomu alaykum
• Vaaalaykum assalom
• Rahmat
• Yaxshimisiz?
• Xayr
• Ha
• Yo'q
• Kechirasiz
• Uylayapmanda kemay qolyaptida
• Qimirlaganingni otaman

Boshlash uchun shunchaki rasm yuboring! 📸
  `.trim();

  await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
});

/**
 * Help command handler
 */
bot.command('help', async (ctx) => {
  const helpMessage = `
ℹ️ *Qanday ishlatish kerak:*

1. Menga istalgan rasmni yuboring
2. Biroz kuting (30-60 soniya)
3. Shaxsiy stikerlar to'plamingizni qabul qiling!

*Eslatma:* Ko'p foydalanuvchilar bo'lganda biroz vaqt olishi mumkin.

Yordam uchun: @${ctx.botInfo.username}
  `.trim();

  await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
});

/**
 * Handle "Generate Again" callback
 */
bot.action('generate_again', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('📸 Ajoyib! Yangi stikerlar to\'plami uchun yana rasm yuboring.');
});

/**
 * Photo message handler
 */
bot.on(message('photo'), async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || `user${userId}`;
  const chatId = ctx.chat.id;

  try {
    // Get the largest photo
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const fileId = photo.file_id;

    logger.info(`Received photo from user ${userId} (${username})`);

    // Send initial message
    await ctx.reply('📸 Rasm qabul qilindi! Stikerlar tayyorlanmoqda...\n\nBu jarayon 30-60 soniya vaqt olishi mumkin. Iltimos kuting! ⏳');

    // Get file URL
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${config.telegramToken}/${file.file_path}`;

    // Download the image
    const imagePath = await downloadImage(fileUrl, userId);

    // Add job to queue
    const job = await queueService.addJob({
      userId,
      username,
      chatId,
      imageUrl: fileUrl,
      imagePath,
    });

    logger.info(`Job ${job.id} added to queue for user ${userId}`);

    // Get queue stats
    const stats = await queueService.getStats();
    
    if (stats.waiting > 0) {
      await ctx.reply(
        `⏳ Sizning so'rovingiz navbatda. O'rningiz: ${stats.waiting}\n\n` +
        `Faol jarayonlar: ${stats.active}\n` +
        `Iltimos kuting, tayyor bo'lganda xabar beraman!`
      );
    }
  } catch (error) {
    logger.error('Error handling photo:', error);
    await ctx.reply('❌ Kechirasiz, rasmni qayta ishlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
  }
});

/**
 * Process sticker generation jobs
 */
queueService.process(config.maxConcurrentJobs, async (job): Promise<StickerJobResult> => {
  const { userId, username, chatId, imagePath } = job.data;

  try {
    // Update progress
    await job.progress(10);
    await bot.telegram.sendMessage(chatId, '🎨 Rasmlar tayyorlanmoqda... (1/3)');

    // Generate AI variations (now strictly copies in Text Overlay mode)
    const variations = await imageGenerator.generateVariations(imagePath);
    await job.progress(50);
    await bot.telegram.sendMessage(chatId, '✍️ Matnlar yozilmoqda... (2/3)');

    // Process stickers (add text, resize, convert)
    const stickerPaths = await imageProcessor.processStickers(variations, config.greetings);
    await job.progress(80);
    await bot.telegram.sendMessage(chatId, '📦 Stikerlar to\'plami yaratilmoqda... (3/3)');

    // Create sticker set
    const stickerSetName = await stickerService.createStickerSet(userId, username, stickerPaths);
    const stickerUrl = stickerService.getStickerSetUrl(stickerSetName);

    await job.progress(100);

    // Send success message with button
    await bot.telegram.sendMessage(
      chatId,
      `✅ *Sizning stikerlar to'plamingiz tayyor!*\n\n` +
      `Shaxsiy stikerlaringizdan zavqlaning! 🎉`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📦 To\'plamni qo\'shish', url: stickerUrl }],
            [{ text: '🔄 Yana yasash', callback_data: 'generate_again' }]
          ]
        }
      }
    );

    // Cleanup
    imageGenerator.cleanup([imagePath, ...variations]);
    imageProcessor.cleanup(stickerPaths);

    return { success: true, stickerSetName };
  } catch (error) {
    logger.error(`Error processing job for user ${userId}:`, error);

    // Send error message
    let errorMessage = '❌ Kechirasiz, stikerlar to\'plamini yaratishda xatolik yuz berdi.';
    
    // Check for specific errors
    if (String(error).includes('Forbidden')) {
      errorMessage += '\n\nBot bloklangan yoki ruxsat yo\'q.';
    } else if (String(error).includes('STICKERSET_INVALID')) {
      errorMessage += '\n\nNoto\'g\'ri nom.';
    } else {
      errorMessage += '\n\nIltimos, keyinroq qayta urinib ko\'ring.';
    }

    await bot.telegram.sendMessage(chatId, errorMessage);

    // Cleanup
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    return { success: false, error: String(error) };
  }
});

/**
 * Download image from Telegram
 */
async function downloadImage(url: string, userId: number): Promise<string> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);
  
  const imagePath = path.join(tempDir, `input_${userId}_${Date.now()}.jpg`);
  fs.writeFileSync(imagePath, buffer);
  
  logger.debug(`Downloaded image to ${imagePath}`);
  return imagePath;
}

/**
 * Error handler
 */
bot.catch((err, ctx) => {
  logger.error('Bot error:', err);
  ctx.reply('❌ Kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.').catch(() => {});
});

/**
 * Graceful shutdown
 */
process.once('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await queueService.close();
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await queueService.close();
  bot.stop('SIGTERM');
  process.exit(0);
});

/**
 * Start the bot
 */
logger.info('Attempting to launch bot...');
logger.debug(`Bot token: ${config.telegramToken.substring(0, 10)}...`);

bot.launch()
  .then(() => {
    logger.info(`Bot started successfully as @${bot.botInfo?.username}`);
    logger.info('Waiting for messages...');
  })
  .catch((error) => {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  });
