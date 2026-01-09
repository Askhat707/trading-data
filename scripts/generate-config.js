#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Генерируем firebase-config.js из GitHub Secrets...\n');

// Получаем значения из переменных окружения
const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Проверяем, что все значения есть
let missing = [];
for (const [key, value] of Object.entries(config)) {
  if (!value) {
    missing.push(key);
  }
}

if (missing.length > 0) {
  console.error('❌ Отсутствуют секреты:', missing.join(', '));
  process.exit(1);
}

// Генерируем содержимое файла
const fileContent = `// ====================================================
// 🔥 FIREBASE CONFIG - АВТОМАТИЧЕСКИ СГЕНЕРИРОВАН
// ⚠️ Этот файл создается CI/CD из GitHub Secrets
// ====================================================

console.log('🚀 Загрузка Firebase конфигурации...');

const firebaseConfig = {
  apiKey: "${config.apiKey}",
  authDomain: "${config.authDomain}",
  databaseURL: "${config.databaseURL}",
  projectId: "${config.projectId}",
  storageBucket: "${config.storageBucket}",
  messagingSenderId: "${config.messagingSenderId}",
  appId: "${config.appId}",
  measurementId: "${config.measurementId}"
};

console.log('✅ Конфигурация Firebase готова:', firebaseConfig.projectId);

// Сохраняем в глобальной области видимости
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
  console.log('✅ firebaseConfig сохранен в window');
}

// CommonJS экспорт (если используется в Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
}
`;

// Записываем файл
const outputPath = path.join(__dirname, '..', 'firebase-config.js');

try {
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  
  const stats = fs.statSync(outputPath);
  console.log('✅ Файл создан успешно');
  console.log('📂 Путь:', outputPath);
  console.log('📏 Размер:', stats.size, 'байт');
  console.log('🏗️  Проект:', config.projectId);
  console.log('');
  console.log('✅ КОНФИГУРАЦИЯ FIREBASE ГОТОВА К ДЕПЛОЮ');
  
} catch (error) {
  console.error('❌ Ошибка создания файла:', error.message);
  process.exit(1);
}
