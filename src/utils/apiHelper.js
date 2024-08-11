const fetch = require('node-fetch');

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

module.exports = { fetchWithRetry };