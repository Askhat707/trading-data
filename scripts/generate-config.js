// scripts/generate-config.js
const fs = require('fs');
const path = require('path');

// Читаем переменные окружения
const config = {
  apiKey: process.env.FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'YOUR_DATABASE_URL',
  projectId: process.env.FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: process.env.FIREBASE_APP_ID || 'YOUR_APP_ID'
};

// Генерируем firebase-config.js
const configContent = `// ⚠️ ВНИМАНИЕ: Этот файл генерируется автоматически!
// Не коммитьте его в репозиторий!

const firebaseConfig = {
  apiKey: "${config.apiKey}",
  authDomain: "${config.authDomain}",
  databaseURL: "${config.databaseURL}",
  projectId: "${config.projectId}",
  storageBucket: "${config.storageBucket}",
  messagingSenderId: "${config.messagingSenderId}",
  appId: "${config.appId}"
};

console.log('✅ Firebase конфиг загружен');
`;

// Записываем файл в корень проекта
const configPath = path.join(__dirname, '../firebase-config.js');
fs.writeFileSync(configPath, configContent, 'utf8');
console.log('✅ firebase-config.js создан успешно!');
