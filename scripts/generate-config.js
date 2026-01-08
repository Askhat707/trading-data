#!/usr/bin/env node

/**
 * Скрипт для генерации firebase-config.js из шаблона и секретов
 * Запуск: node scripts/generate-config.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Для загрузки .env файла

console.log('🔧 Генерация firebase-config.js из секретов...\n');

// Пути к файлам
const templatePath = path.join(__dirname, '../firebase-config.js.template');
const outputPath = path.join(__dirname, '../firebase-config.js');

// Проверяем существование шаблона
if (!fs.existsSync(templatePath)) {
  console.error('❌ Шаблон firebase-config.js.template не найден!');
  process.exit(1);
}

// Читаем шаблон
let template = fs.readFileSync(templatePath, 'utf8');

// Список необходимых переменных
const requiredVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_DATABASE_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID'
];

// Проверяем наличие переменных окружения
console.log('📋 Проверка переменных окружения:');
let allVarsExist = true;

const replacements = {};

requiredVars.forEach(varName => {
  // Пробуем получить из окружения (GitHub Actions или .env)
  const value = process.env[varName];
  
  if (!value) {
    console.error(`❌ Отсутствует переменная: ${varName}`);
    allVarsExist = false;
  } else {
    // Скрываем часть значения для безопасности в логах
    const maskedValue = varName.includes('KEY') || varName.includes('ID') 
      ? value.substring(0, 10) + '...' + value.substring(value.length - 5)
      : value;
    
    console.log(`✅ ${varName}: ${maskedValue}`);
    
    // Добавляем замену
    replacements[`{{${varName}}}`] = value;
  }
});

if (!allVarsExist) {
  console.error('\n❌ Не все переменные окружения заданы!');
  console.error('Проверьте:');
  console.error('1. Для локальной разработки: создайте .env файл с переменными');
  console.error('2. Для GitHub Actions: добавьте Secrets в настройках репозитория');
  console.error('\nПример .env файла:');
  console.log(`
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_PROJECT_ID=your-project
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=1234567890
FIREBASE_APP_ID=1:1234567890:web:abcdef123456
FIREBASE_MEASUREMENT_ID=G-ABCDEF
  `);
  process.exit(1);
}

// Заменяем переменные в шаблоне
let generatedConfig = template;
Object.entries(replacements).forEach(([placeholder, value]) => {
  generatedConfig = generatedConfig.replace(new RegExp(placeholder, 'g'), value);
});

// Добавляем лог проверки
const checkLog = `
// ====================================================
// ✅ СГЕНЕРИРОВАНО АВТОМАТИЧЕСКИ
// 📅 ${new Date().toISOString()}
// ====================================================

console.log('🚀 Firebase конфигурация загружена из GitHub Secrets');
console.log('   Проект: ${replacements['{{FIREBASE_PROJECT_ID}}']}');
console.log('   Database: ${replacements['{{FIREBASE_DATABASE_URL}}']}');
console.log('   Auth Domain: ${replacements['{{FIREBASE_AUTH_DOMAIN}}']}');

// Проверка что все переменные заменены
const configCheck = window.firebaseConfig || {};
const missingVars = Object.values(configCheck).filter(v => v.includes('{{'));
if (missingVars.length > 0) {
  console.error('❌ ОШИБКА: Не все переменные заменены!');
  console.error('   Проверьте GitHub Secrets');
} else {
  console.log('✅ Все переменные успешно заменены');
}
`;

// Вставляем лог проверки после window.firebaseConfig
if (generatedConfig.includes('window.firebaseConfig = firebaseConfig;')) {
  generatedConfig = generatedConfig.replace(
    'window.firebaseConfig = firebaseConfig;',
    `window.firebaseConfig = firebaseConfig;${checkLog}`
  );
}

// Сохраняем сгенерированный файл
fs.writeFileSync(outputPath, generatedConfig, 'utf8');

console.log('\n✅ firebase-config.js успешно создан!');
console.log(`📁 Файл: ${outputPath}`);
console.log('\n📋 Содержимое (первые 10 строк):');
console.log(generatedConfig.split('\n').slice(0, 10).join('\n'));
console.log('...');

// Проверяем созданный файл
const generated = fs.readFileSync(outputPath, 'utf8');
const hasRemainingPlaceholders = generated.includes('{{');

if (hasRemainingPlaceholders) {
  console.error('\n⚠️  ВНИМАНИЕ: В сгенерированном файле остались переменные!');
  const matches = generated.match(/\{\{.*?\}\}/g);
  console.error('   Не замененные переменные:', matches);
} else {
  console.log('\n✅ Все переменные успешно заменены в сгенерированном файле');
}
