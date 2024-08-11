const axios = require('axios');
const FormData = require('form-data');
const config = require('../../config');

async function processVoiceMessage(voice) {
  try {
    console.log('Starting voice message processing');

    // Получаем файл голосового сообщения
    const fileLink = await voice.getFileLink();
    console.log('File link obtained:', fileLink);

    // Скачиваем файл
    const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
    console.log('Voice file downloaded');

    // Создаем FormData и добавляем аудиофайл
    const formData = new FormData();
    formData.append('file', Buffer.from(response.data), { filename: 'voice.ogg', contentType: 'audio/ogg' });
    formData.append('model', 'whisper-1');

    console.log('Sending request to Whisper API');
    // Отправляем запрос на API Whisper
    const transcriptionResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
      },
    });

    console.log('Received response from Whisper API');

    if (transcriptionResponse.data && transcriptionResponse.data.text) {
      console.log('Transcription successful:', transcriptionResponse.data.text);
      return transcriptionResponse.data.text;
    } else {
      console.error('Unexpected response from Whisper API:', transcriptionResponse.data);
      return 'Извините, не удалось распознать голосовое сообщение.';
    }
  } catch (error) {
    console.error('Error processing voice message:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    return 'Извините, произошла ошибка при обработке голосового сообщения.';
  }
}

module.exports = { processVoiceMessage };