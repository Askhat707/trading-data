// scripts/generate-config.js
const fs = require('fs');
const path = require('path');

console.log('📝 Генерирую firebase-config.js...');

// Получаем переменные из окружения
const config = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.FIREBASE_DATABASE_URL || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || ''
};

// Проверяем, что все значения заполнены
const missingVars = Object.entries(config)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Отсутствуют переменные окружения:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  process.exit(1);
}

console.log('✅ Все переменные найдены');

// Создаем контент файла
const configContent = `// ⚠️ ВНИМАНИЕ: Этот файл генерируется автоматически!
// Не коммитьте firebase-config.js в репозиторий!

const firebaseConfig = {
  apiKey: "${config.apiKey}",
  authDomain: "${config.authDomain}",
  databaseURL: "${config.databaseURL}",
  projectId: "${config.projectId}",
  storageBucket: "${config.storageBucket}",
  messagingSenderId: "${config.messagingSenderId}",
  appId: "${config.appId}"
};

// Инициализируем Firebase (если еще не инициализирован)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase инициализирован успешно');
  } catch (error) {
    console.error('❌ Ошибка инициализации Firebase:', error);
  }
}

// Экспортируем конфиг для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
}

window.FIREBASE_CONFIG = firebaseConfig;
`;

// Записываем в корень проекта
const outputPath = path.join(process.cwd(), 'firebase-config.js');
try {
  fs.writeFileSync(outputPath, configContent, 'utf8');
  console.log(`✅ firebase-config.js создан: ${outputPath}`);
  console.log(`📊 Размер файла: ${Buffer.byteLength(configContent)} байт`);
} catch (error) {
  console.error(`❌ Ошибка при записи firebase-config.js:`, error);
  process.exit(1);
}
