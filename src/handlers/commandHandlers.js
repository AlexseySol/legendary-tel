const { logBot } = require('../bot');
const { NEW_TELEGRAM_CHAT_ID } = require('../../config');

function handleStart(ctx) {
  const userName = ctx.from.first_name || ctx.from.username;
  const startMessage = `Привет, ${userName}! Я кофейный бот. Чем могу помочь?`;
  ctx.reply(startMessage);
  console.log(`Диалог:\nBot to ${userName}: ${startMessage}`);
  
  const logMessage = `Bot to ${userName}: ${startMessage}`;
  logBot.telegram.sendMessage(NEW_TELEGRAM_CHAT_ID, logMessage);
}

module.exports = { handleStart };