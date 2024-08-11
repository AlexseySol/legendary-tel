const fs = require('fs').promises;
const path = require('path');

async function loadCoffeeData() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data', 'coffee_data.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`Error loading coffee data: ${error.message}`);
    return {
      'Эспрессо': { description: 'Крепкий кофе', price: 30 },
      'Капучино': { description: 'Кофе с молочной пенкой', price: 40 }
    };
  }
}

module.exports = { loadCoffeeData };