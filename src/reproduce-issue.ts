
import 'dotenv/config';
import { Telegraf } from 'telegraf';

async function testMessage() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.error("No token found in .env");
        return;
    }

    const bot = new Telegraf(token);
    // User ID found in logs
    const chatId = 1030276276; 

    console.log(`Attempting to send message to ${chatId}...`);

    try {
        await bot.telegram.sendMessage(chatId, "🔔 Test message from reproduction script. Can you see this?");
        console.log("✅ Message sent successfully according to API.");
    } catch (error) {
        console.error("❌ Failed to send message:", error);
    }
}

testMessage();
