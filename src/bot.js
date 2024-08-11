const { Telegraf } = require('telegraf');
const config = require('../config');
const { processMessage } = require('./handlers/messageHandlers');

const mainBot = new Telegraf(config.TELEGRAM_BOT_TOKEN_ALFA);
const logBot = new Telegraf(config.NEW_TELEGRAM_BOT_TOKEN);
const dataBot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

function setupBot() {
  // Обработка команды /start
  mainBot.start((ctx) => {
    const userName = ctx.from.first_name || ctx.from.username;
    const startMessage = `Привет, ${userName}! Я кофейный бот. Чем могу помочь?`;
    ctx.reply(startMessage);
    console.log(`Диалог:\nBot to ${userName}: ${startMessage}`);
    
    const logMessage = `Bot to ${userName}: ${startMessage}`;
    logBot.telegram.sendMessage(config.NEW_TELEGRAM_CHAT_ID, logMessage);
  });

  // Обработка текстовых сообщений
  mainBot.on('text', handleMessage);

  // Обработка голосовых сообщений
  mainBot.on('voice', handleMessage);

  // Обработка изображений
  mainBot.on('photo', handleMessage);
}

async function handleMessage(ctx) {
  const userId = ctx.from.id.toString();
  const userName = ctx.from.first_name || ctx.from.username;
  
  try {
    const response = await processMessage(userId, userName, ctx.message, logBot.telegram.sendMessage.bind(logBot.telegram));
    console.log(`Sending response to ${userName} (${userId}): ${response}`);
    ctx.reply(response);
  } catch (error) {
    console.error('Error processing message:', error);
    ctx.reply('Извините, произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз позже.');
  }
}

module.exports = { mainBot, logBot, dataBot, setupBot };




        /*const { Telegraf } = require('telegraf');
const config = require('../config');
const { processMessage } = require('./handlers/messageHandlers');

const mainBot = new Telegraf(config.TELEGRAM_BOT_TOKEN_ALFA);
const logBot = new Telegraf(config.NEW_TELEGRAM_BOT_TOKEN);
const dataBot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

function setupBot() {
  // Обработка команды /start
  mainBot.start((ctx) => {
    const userName = ctx.from.first_name || ctx.from.username;
    const startMessage = `Привет, ${userName}! Я кофейный бот. Чем могу помочь?`;
    ctx.reply(startMessage);
    console.log(`Диалог:\nBot to ${userName}: ${startMessage}`);
    
    const logMessage = `Bot to ${userName}: ${startMessage}`;
    logBot.telegram.sendMessage(config.NEW_TELEGRAM_CHAT_ID, logMessage);
  });

  // Обработка текстовых сообщений
  mainBot.on('text', handleMessage);

  // Обработка голосовых сообщений
  mainBot.on('voice', handleMessage);

  // Обработка изображений
  mainBot.on('photo', handleMessage);
}

async function handleMessage(ctx) {
  const userId = ctx.from.id.toString();
  const userName = ctx.from.first_name || ctx.from.username;
  
  try {
    const response = await processMessage(userId, userName, ctx.message, logBot.telegram.sendMessage.bind(logBot.telegram));
    console.log(`Sending response to ${userName} (${userId}): ${response}`);
    ctx.reply(response);
  } catch (error) {
    console.error('Error processing message:', error);
    ctx.reply('Извините, произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз позже.');
  }
}

module.exports = { mainBot, logBot, dataBot, setupBot };
 */