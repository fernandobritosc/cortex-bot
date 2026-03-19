import 'dotenv/config';
console.log('TELEGRAM_BOT_TOKEN exists:', !!process.env.TELEGRAM_BOT_TOKEN);
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID);
