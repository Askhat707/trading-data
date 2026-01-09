#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 [GENERATE] Генерируем firebase-config.js...\n');

// Получаем значения
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

// Проверяем все значения
console.log('🔍 [VALIDATE] Проверяем все переменные окружения...');
let hasErrors = false;

Object.entries(config).forEach(([key, value]) => {
  if (!value) {
    console.error(`❌ ${key} = ОТСУТСТВУЕТ`);
    hasErrors = true;
  } else {
    const masked = value.length > 20 ? value.substring(0, 10) + '...' : value;
    console.log(`✅ ${key} = ${masked}`);
  }
});

if (hasErrors) {
  console.error('\n❌ ОШИБКА: Не все переменные окружения установлены!');
  console.error('Проверь GitHub Secrets: Settings → Secrets and variables → Actions');
  process.exit(1);
}

// Генерируем файл
const fileContent = `// ====================================================
// 🔥 FIREBASE CONFIG - АВТОМАТИЧЕСКИ СГЕНЕРИРОВАН
// ⚠️ Этот файл создается CI/CD из GitHub Secrets
// ====================================================

console.log('🚀 [CONFIG] Загрузка Firebase конфигурации...');

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

console.log('✅ [CONFIG] Конфигурация готова:', firebaseConfig.projectId);

// Сохраняем в глобальной области видимости
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
  console.log('✅ [CONFIG] firebaseConfig доступен в window');
}

// CommonJS экспорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
}
`;

// Записываем файл
const outputPath = path.join(__dirname, '..', 'firebase-config.js');

try {
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  
  const stats = fs.statSync(outputPath);
  console.log('\n✅ [WRITE] Файл создан успешно');
  console.log('📂 Путь:', outputPath);
  console.log('📏 Размер:', stats.size, 'байт');
  console.log('🏗️ Проект:', config.projectId);
  console.log('\n✅ FIREBASE CONFIG ГОТОВ К ДЕПЛОЮ');
  
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ [WRITE] Ошибка записи файла:', error.message);
  process.exit(1);
}
