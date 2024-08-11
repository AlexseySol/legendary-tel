require('dotenv').config();

module.exports = {
  TELEGRAM_BOT_TOKEN_ALFA: process.env.TELEGRAM_BOT_TOKEN_ALFA,
  NEW_TELEGRAM_BOT_TOKEN: process.env.NEW_TELEGRAM_BOT_TOKEN,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN, // для отправки данных
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,// для отправки данных
  NEW_TELEGRAM_CHAT_ID: process.env.NEW_TELEGRAM_CHAT_ID,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  PORT: process.env.PORT || 3000,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY
};