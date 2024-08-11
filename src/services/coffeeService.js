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
    console.warn(`Error loading coffee data: ${error.message}`);
    coffeeData = {
      'Эспрессо': { description: 'Крепкий кофе', price: 30 },
      'Капучино': { description: 'Кофе с молочной пенкой', price: 40 }
    };
  }
}

async function initBot() {
  if (!botInitialized) {
    await loadCoffeeData();
    console.log('Bot initialized');
    botInitialized = true;
  }
}

function getCoffeeData() {
  return coffeeData;
}

module.exports = { initBot, getCoffeeData };

