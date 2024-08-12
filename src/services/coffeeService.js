const fs = require('fs').promises;
const path = require('path');

let coffeeData = {};
let botInitialized = false;

async function loadCoffeeData() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data', 'coffee_data.json'), 'utf8');
    coffeeData = JSON.parse(data);
    console.log('Coffee data loaded successfully');
  } catch (error) {
    console.error(`Error loading coffee data: ${error.message}`);
    throw error; // Выбрасываем ошибку, чтобы обработать её на уровне выше
  }
}

async function initBot() {
  if (!botInitialized) {
    console.log('Initializing bot...');
    await loadCoffeeData();
    botInitialized = true;
    console.log('Bot initialized');
  } else {
    console.log('Bot already initialized');
  }
}

async function getCoffeeData() {
  if (Object.keys(coffeeData).length === 0) {
    await loadCoffeeData();
  }
  return coffeeData;
}

module.exports = { initBot, getCoffeeData };