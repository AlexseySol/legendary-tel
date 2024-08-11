// Извлекает данные заказа из сообщения
function extractOrderData(message) {
  const orderData = {};
  const fields = ['name', 'email', 'phone', 'address', 'order'];
  
  fields.forEach(field => {
    const regex = new RegExp(`<${field}>(.*?)</${field}>`, 's');
    const match = message.match(regex);
    if (match) {
      orderData[field] = match[1].trim();
    }
  });

  return orderData;
}

// Проверяет полноту и корректность данных заказа
function validateOrderData(orderData) {
  const requiredFields = ['name', 'email', 'phone', 'address', 'order'];
  const errors = [];

  requiredFields.forEach(field => {
    if (!orderData[field]) {
      errors.push(`Поле "${field}" отсутствует`);
    } else {
      switch (field) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData[field])) {
            errors.push('Некорректный email адрес');
          }
          break;
        case 'phone':
          if (!/^\+?[\d\s()-]{10,}$/.test(orderData[field])) {
            errors.push('Некорректный номер телефона');
          }
          break;
        case 'address':
          if (orderData[field].length < 10) {
            errors.push('Адрес слишком короткий');
          }
          break;
      }
    }
  });

  return errors.length > 0 ? errors.join(', ') : null;
}

// Удаляет теги из сообщения
function removeTags(message) {
  return message.replace(/<\/?[^>]+(>|$)/g, '');
}

module.exports = { extractOrderData, validateOrderData, removeTags };