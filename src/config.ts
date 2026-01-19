export const config = {
  // Telegram Bot
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  
  // Hugging Face
  huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || '',
  huggingFaceModel: 'stabilityai/stable-diffusion-xl-base-1.0', // Free T2I model
  
  // Sticker Configuration
  stickerSize: parseInt(process.env.STICKER_SIZE || '512', 10),
  stickerFormat: 'webp' as const,
  
  // Queue Configuration
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '3', 10),
  redisUrl: process.env.REDIS_URL,
  
  // Uzbek Greetings for Stickers
  greetings: [
    'Assalomu alaykum',
    'Vaaalaykum assalom',
    'Rahmat',
    'Yaxshimisiz?',
    'Xayr',
    'Ha',
    "Yo'q",
    'Kechirasiz'
  ],
  
  // Image Generation Settings
  imageGeneration: {
    numInferenceSteps: 4, // Fast generation for schnell model
    guidanceScale: 0, // Schnell doesn't use guidance
    width: 512,
    height: 512,
  },
  
  // Text Overlay Settings
  textOverlay: {
    fontSize: 48,
    fontFamily: 'Arial, sans-serif',
    fontColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 4,
    position: 'bottom' as 'top' | 'center' | 'bottom',
    padding: 20,
  }
};

// Validate required environment variables
export function validateConfig(): void {
  if (!config.telegramToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is required in .env file');
  }
  if (!config.huggingFaceApiKey) {
    throw new Error('HUGGINGFACE_API_KEY is required in .env file');
  }
}
