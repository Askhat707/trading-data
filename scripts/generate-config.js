#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Начинаем генерацию firebase-config.js...');

// Пути
const templatePath = path.join(__dirname, '../firebase-config.js.template');
const outputPath = path.join(__dirname, '../firebase-config.js');

// Проверяем шаблон
if (!fs.existsSync(templatePath)) {
  console.error('❌ Шаблон не найден:', templatePath);
  console.error('Текущая директория:', __dirname);
  process.exit(1);
}

// Читаем шаблон
const template = fs.readFileSync(templatePath, 'utf8');
console.log('📄 Шаблон загружен');

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
  console.error('❌ Отсутствуют значения для:', missing.join(', '));
  console.error('Проверьте GitHub Secrets в настройках репозитория');
  process.exit(1);
}

// Заменяем плейсхолдеры
let result = template;
result = result.replace('{{FIREBASE_API_KEY}}', config.apiKey);
result = result.replace('{{FIREBASE_AUTH_DOMAIN}}', config.authDomain);
result = result.replace('{{FIREBASE_DATABASE_URL}}', config.databaseURL);
result = result.replace('{{FIREBASE_PROJECT_ID}}', config.projectId);
result = result.replace('{{FIREBASE_STORAGE_BUCKET}}', config.storageBucket);
result = result.replace('{{FIREBASE_MESSAGING_SENDER_ID}}', config.messagingSenderId);
result = result.replace('{{FIREBASE_APP_ID}}', config.appId);
result = result.replace('{{FIREBASE_MEASUREMENT_ID}}', config.measurementId);

// Проверяем, что все заменено
if (result.includes('{{')) {
  console.error('❌ Не все плейсхолдеры заменены!');
  process.exit(1);
}

// Сохраняем
fs.writeFileSync(outputPath, result, 'utf8');
console.log('✅ Файл создан:', outputPath);
console.log('📏 Размер:', result.length, 'байт');
console.log('🏗️  Проект:', config.projectId);
