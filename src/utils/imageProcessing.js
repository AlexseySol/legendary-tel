const axios = require('axios');
const config = require('../../config');

async function processImage(photo) {
  try {
    // Получаем файл изображения
    const fileLink = await photo.getFileLink();
    
    // Отправляем запрос на API GPT-4 Vision
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Опиши это изображение, связанное с кофе или кафе." },
            { type: "image_url", image_url: { url: fileLink } }
          ]
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error processing image:', error);
    return 'Извините, не удалось обработать изображение.';
  }
}

module.exports = { processImage };