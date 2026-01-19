import 'dotenv/config';
import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  process.exit(1);
}

const bot = new Telegraf(token);
const stickerSetName = 'ai_stickers_1030276276_1768783375191_by_ai_stickerpackbot';

async function check() {
  console.log(`Checking sticker set: ${stickerSetName}`);
  try {
    const set = await bot.telegram.getStickerSet(stickerSetName);
    console.log('Sticker set found!');
    console.log('Title:', set.title);
    console.log('Stickers count:', set.stickers.length);
    console.log('URL:', `https://t.me/addstickers/${stickerSetName}`);
  } catch (error) {
    console.error('Error fetching sticker set:', error);
  }
}

check();
