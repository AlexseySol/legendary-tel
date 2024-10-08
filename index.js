const express = require('express');
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const config = require('./config');
const { processMessage } = require('./src/handlers/messageHandlers');

const app = express();
const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN_ALFA);

app.use(express.json());

app.post(`/webhook/${config.TELEGRAM_BOT_TOKEN_ALFA}`, async (req, res) => {
  console.log('Received webhook request');
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error in webhook handler:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userName = ctx.from.first_name || ctx.from.username;
  const userMessage = ctx.message.text;
  
  try {
    const response = await processMessage(userId, userName, userMessage);
    await ctx.reply(response);
  } catch (error) {
    console.error('Error processing message:', error);
    await ctx.reply('Извините, произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз позже.');
  }
});

bot.start((ctx) => {
  const userName = ctx.from.first_name || ctx.from.username;
  ctx.reply(`Привет, ${userName}! Я кофейный бот. Чем могу помочь?`);
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Telegram bot webhook is running' });
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;



/*
const { mainBot, setupBot } = require('./src/bot');
const { initBot } = require('./src/services/coffeeService');

async function start() {
  try {
    await initBot();
    setupBot();
    
    // Запуск бота
    await mainBot.launch();
    
    console.log('Bot is running...');
  } catch (error) {
    console.error('Error starting bot:', error);
  }
}

start();

// Включение graceful stop
process.once('SIGINT', () => mainBot.stop('SIGINT'));
process.once('SIGTERM', () => mainBot.stop('SIGTERM'));
 */










/* require('dotenv').config();
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const { promptTemplate } = require('./prompt.js');

const mainBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN_ALFA);
const logBot = new Telegraf(process.env.NEW_TELEGRAM_BOT_TOKEN);
const dataBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

let coffeeData = {};
let userStates = {};

async function loadCoffeeData() {
  try {
    const data = await fs.readFile('coffee_data.json', 'utf8');
    coffeeData = JSON.parse(data);
    console.log('Coffee data loaded successfully');
  } catch (error) {
    console.warn(`Error loading coffee data: ${error.message}`);
    coffeeData = {
      'Эспрессо': { description: 'Крепкий кофе', price: 30 },
      'Капучино': { description: 'Кофе с молочной пенкой', price: 40 }
    };
  }
}

async function saveToJson(userId, data) {
  try {
    const orderMessage = `Новый заказ:\nИмя: ${data.name}\nEmail: ${data.email}\nТелефон: ${data.phone}\nАдрес: ${data.address}\nЗаказ: ${data.order}`;
    await dataBot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, orderMessage);
    console.log(`Order data sent to Telegram for user ${userId}`);
  } catch (error) {
    console.error('Error sending order data to Telegram:', error);
  }
}

function extractTags(message) {
  const tags = {};
  const relevantTags = ['email', 'phone', 'address', 'name', 'order'];
  const tagRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let match;
  while ((match = tagRegex.exec(message)) !== null) {
    if (relevantTags.includes(match[1])) {
      tags[match[1]] = match[2].trim();
    }
  }
  return tags;
}

function validateTags(tags) {
  const requiredTags = ['email', 'phone', 'address', 'name', 'order'];
  const missingTags = requiredTags.filter(tag => !tags[tag]);
  
  if (missingTags.length > 0) {
    console.log(`Missing required tags: ${missingTags.join(', ')}`);
    return false;
  }

  return true;
}

function ensureAlternatingRoles(context) {
  const fixedContext = [];
  let lastRole = null;
  for (const message of context) {
    if (message.role !== lastRole) {
      fixedContext.push(message);
      lastRole = message.role;
    } else if (message.role === 'user') {
      fixedContext.push({ role: 'assistant', content: 'Продолжайте, пожалуйста.' });
      fixedContext.push(message);
      lastRole = 'user';
    }
  }
  return fixedContext;
}

async function fetchWithRetry(url, options, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (data.type === 'error' && data.error.type === 'overloaded_error') {
        throw new Error('API overloaded');
      }
      
      return data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed: ${error.message}`);
      lastError = error;
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function processMessage(userId, userName, userMessage) {
  if (!userStates[userId]) {
    userStates[userId] = { 
      context: [],
      userName: userName,
      orderData: {}
    };
  }

  userStates[userId].context.push({ role: "user", content: userMessage });

  const fixedContext = ensureAlternatingRoles(userStates[userId].context);

  const filledPrompt = promptTemplate
    .replace('{{COFFEE_DOCUMENT}}', JSON.stringify(coffeeData))
    .replace('{{USER_INPUT}}', userMessage)
    .replace('{{USER_NAME}}', userName);

  try {
    const data = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 500,
        temperature: 0,
        top_p: 0.1,
        system: filledPrompt,
        messages: fixedContext
      })
    });

    if (data && data.content && data.content[0] && data.content[0].text) {
      const replyMessage = data.content[0].text;
      
      const responseMatch = replyMessage.match(/<response>([\s\S]*?)<\/response>/);
      if (responseMatch) {
        const responseContent = responseMatch[1];
        const tags = extractTags(responseContent);

        userStates[userId].orderData = { ...userStates[userId].orderData, ...tags };

        if (validateTags(userStates[userId].orderData)) {
          console.log(`Все необходимые данные для пользователя ${userId} получены.`);
          await saveToJson(userId, userStates[userId].orderData);
        } else {
          console.log(`Не все необходимые данные для пользователя ${userId} получены.`);
        }

        userStates[userId].context.push({ role: "assistant", content: responseContent });
        
        const cleanResponse = responseContent.replace(/<[^>]+>.*?<\/[^>]+>/g, '');

        // Отправляем запрос и ответ в лог-чат в одном сообщении
        const logMessage = `Диалог:\nUser ${userName}: ${userMessage}\nBot: ${cleanResponse}`;
        await logBot.telegram.sendMessage(process.env.NEW_TELEGRAM_CHAT_ID, logMessage);

        return cleanResponse;
      } else {
        console.log('Тег <response> не найден в ответе Claude');
        return 'Извините, произошла ошибка при обработке ответа.';
      }
    } else {
      console.error('Unexpected API response:', data);
      return 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз чуть позже.';
    }
  } catch (error) {
    console.error('Error:', error);
    return 'Извините, в данный момент сервис перегружен. Пожалуйста, попробуйте еще раз через несколько минут.';
  }
}

mainBot.start((ctx) => {
  const userName = ctx.from.first_name || ctx.from.username;
  const startMessage = `Привет, ${userName}! Я кофейный бот. Чем могу помочь?`;
  ctx.reply(startMessage);
  console.log(`Диалог:\nBot to ${userName}: ${startMessage}`);
  
  const logMessage = `Bot to ${userName}: ${startMessage}`;
  logBot.telegram.sendMessage(process.env.NEW_TELEGRAM_CHAT_ID, logMessage);
});

mainBot.on('text', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userName = ctx.from.first_name || ctx.from.username;
  const userMessage = ctx.message.text;

  const response = await processMessage(userId, userName, userMessage);
  ctx.reply(response);
});

async function startBot() {
  await loadCoffeeData();
  
  mainBot.launch();
  logBot.launch();
  dataBot.launch();
  console.log('Боты запущены...');
}

startBot().catch(error => {
  console.error('Error starting bots:', error);
});

process.once('SIGINT', () => {
  mainBot.stop('SIGINT');
  logBot.stop('SIGINT');
  dataBot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  mainBot.stop('SIGTERM');
  logBot.stop('SIGTERM');
  dataBot.stop('SIGTERM');
});


*/


/* {
  "name": "telegram_claude_bot",
  "version": "1.0.0",
  "description": "",
  "main": "bot.js",
  "scripts": {
    "start": "node bot.js"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "dotenv": "^10.0.0",
    "mammoth": "^1.8.0",
    "node-fetch": "^2.7.0",
    "telegraf": "^4.16.3"
  }
}
 */
