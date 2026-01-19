# Telegram AI Sticker Bot 🎨

A Telegram bot that generates personalized sticker packs using AI image generation (Hugging Face) with Uzbek greeting text overlays.

## Features

- 🤖 **AI-Powered**: Uses Hugging Face's FLUX.1-schnell model for fast, free image generation
- 🇺🇿 **Uzbek Greetings**: 8 common Uzbek phrases on each sticker
- ⚡ **Fast & Reliable**: Queue-based processing with rate limiting
- 📦 **Auto Sticker Packs**: Automatically creates Telegram sticker sets
- 🎨 **Professional Text Overlays**: Clean, readable text with outlines

## Uzbek Greetings Included

Each sticker pack contains 8 stickers with these greetings:

1. **Assalomu alaykum** - Peace be upon you (greeting)
2. **Vaaalaykum assalom** - And upon you peace (response)
3. **Rahmat** - Thank you
4. **Yaxshimisiz?** - How are you?
5. **Xayr** - Goodbye
6. **Ha** - Yes
7. **Yo'q** - No
8. **Kechirasiz** - Sorry/Excuse me

## Prerequisites

- Node.js 18+ installed
- Telegram account
- Hugging Face account (free)

## Setup Instructions

### 1. Clone or Download the Project

```bash
cd /Users/telmacuz/Desktop/My\ projects/telegram-sticker-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Get Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 4. Get Hugging Face API Key

1. Go to [Hugging Face](https://huggingface.co/)
2. Sign up for a free account (if you don't have one)
3. Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Click "New token"
5. Give it a name (e.g., "telegram-bot") and select "Read" permission
6. Copy the token (looks like `hf_xxxxxxxxxxxxxxxxxxxxx`)

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file and add your tokens:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

### 6. Run the Bot

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## Usage

1. Start a chat with your bot on Telegram
2. Send `/start` to see the welcome message
3. Send any photo to the bot
4. Wait 30-60 seconds while the bot:
   - Generates AI variations of your photo
   - Adds Uzbek greeting text overlays
   - Creates a sticker pack
5. Click the link to add your custom sticker pack!

## Project Structure

```
telegram-sticker-bot/
├── src/
│   ├── index.ts              # Main bot application
│   ├── config.ts             # Configuration and settings
│   ├── services/
│   │   ├── imageGenerator.ts # AI image generation (Hugging Face)
│   │   ├── imageProcessor.ts # Image processing (resize, text, WebP)
│   │   ├── stickerService.ts # Telegram sticker pack creation
│   │   └── queueService.ts   # Job queue for rate limiting
│   └── utils/
│       └── logger.ts         # Logging utility
├── tmp/                      # Temporary files (auto-created)
├── package.json
├── tsconfig.json
├── .env                      # Your environment variables
└── README.md
```

## Configuration

You can customize the bot by editing `src/config.ts`:

- **Greetings**: Change the Uzbek phrases
- **Sticker Size**: Adjust dimensions (default: 512x512)
- **Text Style**: Modify font size, color, position
- **AI Model**: Switch to different Hugging Face models
- **Queue Settings**: Adjust concurrency and rate limits

## Deployment

### Option 1: Railway (Recommended)

1. Create account on [Railway](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub"
3. Connect your repository
4. Add environment variables in Railway dashboard
5. Deploy!

### Option 2: Render

1. Create account on [Render](https://render.com/)
2. Click "New" → "Web Service"
3. Connect your repository
4. Set build command: `npm install && npm run build`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy!

### Option 3: VPS (DigitalOcean, AWS, etc.)

```bash
# Clone repository
git clone <your-repo-url>
cd telegram-sticker-bot

# Install dependencies
npm install

# Build
npm run build

# Run with PM2 (process manager)
npm install -g pm2
pm2 start dist/index.js --name telegram-bot
pm2 save
pm2 startup
```

## Troubleshooting

### Bot doesn't respond
- Check if bot token is correct in `.env`
- Verify bot is running (`npm run dev`)
- Check logs for errors

### "HUGGINGFACE_API_KEY is required" error
- Make sure you added the API key to `.env` file
- Verify the key is valid on Hugging Face

### Sticker generation is slow
- This is normal! Free tier has rate limits
- Each pack takes 30-60 seconds to generate
- Consider upgrading to paid Hugging Face tier for faster generation

### "Failed to create sticker set" error
- User may have too many sticker sets (Telegram limit)
- Try again with a different photo
- Check bot has proper permissions

## API Rate Limits

**Hugging Face Free Tier:**
- ~100-200 requests per day
- Queue system handles this automatically
- Users may experience delays during high usage

**Solutions:**
- Upgrade to Hugging Face Pro ($9/month) for unlimited requests
- Use Redis for persistent queue (add `REDIS_URL` to `.env`)
- Deploy multiple bot instances

## Tech Stack

- **Node.js** + **TypeScript** - Fast, type-safe development
- **Telegraf** - Telegram bot framework
- **Hugging Face Inference API** - AI image generation
- **Sharp** - High-performance image processing
- **Canvas** - Text rendering
- **Bull** - Job queue for reliability

## License

MIT License - feel free to use and modify!

## Author

Created by **Yusuf Ne'matullayev**

## Support

For issues or questions:
- Open an issue on GitHub
- Contact: info@yusufjon.uz

---

**Enjoy creating AI-powered sticker packs! 🎉**
