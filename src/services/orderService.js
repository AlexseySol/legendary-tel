const { Telegraf } = require('telegraf');
const config = require('../../config');

let orderBot;

try {
  console.log('Initializing order bot with token:', config.TELEGRAM_BOT_TOKEN);
  orderBot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
  console.log('Order bot initialized successfully');
} catch (error) {
  console.error('Failed to initialize order bot:', error);
}

// Отправляет данные заказа в Telegram канал
async function saveToJson(userId, data) {
  console.log('Entering saveToJson function');
  console.log('User ID:', userId);
  console.log('Order data:', data);

  if (!orderBot) {
    console.error('Order bot is not initialized');
    return false;
  }

  if (!config.TELEGRAM_CHAT_ID) {
    console.error('TELEGRAM_CHAT_ID is not set in config');
    return false;
  }

  try {
    console.log(`Attempting to save order for user ${userId}`);
    const orderMessage = `Новый заказ от пользователя ${userId}:
Имя: ${data.name}
Email: ${data.email}
Телефон: ${data.phone}
Адрес: ${data.address}
Заказ: ${data.order}`;

    console.log('Sending message to Telegram');
    console.log('Chat ID:', config.TELEGRAM_CHAT_ID);
    console.log('Message:', orderMessage);

    await orderBot.telegram.sendMessage(config.TELEGRAM_CHAT_ID, orderMessage);
    console.log(`Order data sent to Telegram for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error sending order data to Telegram:', error);
    return false;
  }
}

module.exports = { saveToJson };