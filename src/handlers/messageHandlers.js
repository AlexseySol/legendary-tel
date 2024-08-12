const fs = require('fs').promises;
const path = require('path');
const { fetchWithRetry } = require('../utils/apiHelper');
const { extractOrderData, validateOrderData, removeTags } = require('../utils/messageProcessing');
const { getCoffeeData } = require('../services/coffeeService');
const { saveToJson } = require('../services/orderService');
const config = require('../../config');
const { logBot } = require('../bot');

let userStates = {};

// Обрабатывает входящее сообщение пользователя
async function processMessage(userId, userName, userMessage) {
  console.log(`Processing message from ${userName} (${userId}): ${userMessage}`);

  if (!userStates[userId]) {
    userStates[userId] = { 
      context: [],
      userName: userName,
      orderData: {},
      orderConfirmed: false,
      orderStarted: false
    };
  }

  userStates[userId].context.push({ role: "user", content: userMessage });

  try {
    const promptTemplate = await fs.readFile(path.join(process.cwd(), 'prompts', 'prompt.js'), 'utf8');
    const coffeeData = await getCoffeeData(); // Получаем актуальные данные о кофе
    const filledPrompt = promptTemplate
      .replace('{{COFFEE_DOCUMENT}}', JSON.stringify(coffeeData))
      .replace('{{USER_INPUT}}', userMessage)
      .replace('{{USER_NAME}}', userName);

    const data = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 500,
        temperature: 0,
        top_p: 0.1,
        system: filledPrompt,
        messages: userStates[userId].context
      })
    });

    if (data && data.content && data.content[0] && data.content[0].text) {
      const replyMessageWithTags = data.content[0].text;
      const replyMessageWithoutTags = removeTags(replyMessageWithTags);
      console.log(`Received response from API: ${replyMessageWithTags}`);
      
      userStates[userId].context.push({ role: "assistant", content: replyMessageWithTags });

      const logMessage = `Диалог:\nUser ${userName}: ${userMessage}\nBot: ${replyMessageWithTags}`;
      console.log(logMessage);
      await logBot.telegram.sendMessage(config.NEW_TELEGRAM_CHAT_ID, logMessage);

      const newOrderData = extractOrderData(replyMessageWithTags);
      
      // Проверяем, начался ли процесс заказа
      if (Object.keys(newOrderData).length > 0) {
        userStates[userId].orderStarted = true;
      }

      if (userStates[userId].orderStarted) {
        Object.assign(userStates[userId].orderData, newOrderData);
        console.log(`Updated order data for user ${userId}:`, userStates[userId].orderData);

        const validationError = validateOrderData(userStates[userId].orderData);
        if (validationError) {
          return `${replyMessageWithoutTags}\n\nПожалуйста, уточните следующую информацию: ${validationError}`;
        }

        if (Object.keys(userStates[userId].orderData).length === 5 && !userStates[userId].orderConfirmed) {
          const orderSent = await saveToJson(userId, userStates[userId].orderData);
          if (orderSent) {
            userStates[userId].orderConfirmed = true;
            return "Спасибо за ваш заказ! Он был успешно отправлен. Мы свяжемся с вами в ближайшее время для подтверждения деталей доставки.";
          } else {
            return "Извините, произошла ошибка при отправке вашего заказа. Пожалуйста, попробуйте еще раз позже.";
          }
        }
      }

      return replyMessageWithoutTags;
    } else {
      console.error('Unexpected API response structure:', data);
      return 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз чуть позже.';
    }
  } catch (error) {
    console.error('Error processing message:', error);
    return 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз через несколько минут.';
  }
}

module.exports = { processMessage };

/* const fs = require('fs').promises;
const path = require('path');
const { fetchWithRetry } = require('../utils/apiHelper');
const { extractTags, validateTags } = require('../utils/messageProcessing');
const { getCoffeeData } = require('../services/coffeeService');
const { saveToJson } = require('../services/orderService');
const config = require('../../config');
const { processVoiceMessage } = require('../utils/voiceProcessing');
const { processImage } = require('../utils/imageProcessing');

let userStates = {};

async function processMessage(userId, userName, message, logBotSendMessage) {
  console.log(`Processing message from ${userName} (${userId})`);

  if (!userStates[userId]) {
    userStates[userId] = { 
      context: [],
      userName: userName,
      orderData: {},
      orderConfirmed: false
    };
  }

  let userMessage = '';
  let imageDescription = '';

  // Обработка голосового сообщения
  if (message.voice) {
    console.log('Received voice message, starting processing');
    try {
      userMessage = await processVoiceMessage(message.voice);
      console.log('Voice message processed successfully:', userMessage);
    } catch (error) {
      console.error('Error processing voice message:', error);
      return "Извините, произошла ошибка при обработке голосового сообщения. Пожалуйста, попробуйте еще раз или отправьте текстовое сообщение.";
    }
  } 
  // Обработка изображения
  else if (message.photo) {
    console.log('Received image, starting processing');
    try {
      imageDescription = await processImage(message.photo[message.photo.length - 1]);
      userMessage = `[Пользователь отправил изображение] ${imageDescription}`;
      console.log('Image processed successfully:', userMessage);
    } catch (error) {
      console.error('Error processing image:', error);
      return "Извините, произошла ошибка при обработке изображения. Пожалуйста, попробуйте еще раз или отправьте текстовое сообщение.";
    }
  }
  // Обработка текстового сообщения
  else if (message.text) {
    userMessage = message.text;
    console.log('Received text message:', userMessage);
  } else {
    return "Извините, я могу обрабатывать только текстовые сообщения, голосовые сообщения и изображения.";
  }

  const tags = extractTags(userMessage);
  if (Object.keys(tags).length > 0) {
    const errors = validateTags(tags);
    if (errors) {
      const errorMessage = "Пожалуйста, исправьте следующие ошибки:\n" + errors.join("\n");
      userStates[userId].context.push({ role: "assistant", content: errorMessage });
      return errorMessage;
    } else {
      userStates[userId].orderData = { ...userStates[userId].orderData, ...tags };
      const confirmationMessage = "Ваши данные приняты. Пожалуйста, подтвердите заказ, написав 'Подтверждаю'.";
      userStates[userId].context.push({ role: "assistant", content: confirmationMessage });
      return confirmationMessage;
    }
  }

  if (userMessage.toLowerCase() === 'подтверждаю' && Object.keys(userStates[userId].orderData).length === 5) {
    if (!userStates[userId].orderConfirmed) {
      userStates[userId].orderConfirmed = true;
      await saveToJson(userId, userStates[userId].orderData);
      const thankYouMessage = "Спасибо за ваш заказ! Он был успешно отправлен.";
      userStates[userId].context.push({ role: "assistant", content: thankYouMessage });
      return thankYouMessage;
    } else {
      return "Ваш заказ уже был подтвержден и отправлен.";
    }
  }

  userStates[userId].context.push({ role: "user", content: userMessage });

  const promptTemplate = await fs.readFile(path.join(process.cwd(), 'prompts', 'prompt.js'), 'utf8');
  const filledPrompt = promptTemplate
    .replace('{{COFFEE_DOCUMENT}}', JSON.stringify(getCoffeeData()))
    .replace('{{USER_INPUT}}', userMessage)
    .replace('{{USER_NAME}}', userName)
    .replace('{{IMAGE_DESCRIPTION}}', imageDescription);

  try {
    const data = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: filledPrompt },
          ...userStates[userId].context
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      const replyMessage = data.choices[0].message.content;
      console.log(`Received response from API: ${replyMessage}`);
      
      // Убираем все теги из ответа
      const cleanResponse = replyMessage.replace(/<[^>]+>.*?<\/[^>]+>/g, '').trim();
      
      userStates[userId].context.push({ role: "assistant", content: cleanResponse });

      const logMessage = `Диалог:\nUser ${userName}: ${userMessage}\nBot: ${cleanResponse}`;
      await logBotSendMessage(config.NEW_TELEGRAM_CHAT_ID, logMessage);

      return cleanResponse;
    } else {
      console.error('Unexpected API response:', data);
      return 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз чуть позже.';
    }
  } catch (error) {
    console.error('Error:', error);
    return 'Извините, в данный момент сервис перегружен. Пожалуйста, попробуйте еще раз через несколько минут.';
  }
}

module.exports = { processMessage };*/