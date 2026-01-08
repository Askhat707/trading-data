#!/usr/bin/env node

/**
 * Скрипт для генерации firebase-config.js из шаблона и GitHub Secrets
 * Использует переменные окружения (из GitHub Actions или локальные)
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 ГЕНЕРАЦИЯ firebase-config.js');
console.log('================================\n');

// Пути
const templatePath = path.join(__dirname, '../firebase-config.js.template');
const outputPath = path.join(__dirname, '../firebase-config.js');

// Проверяем шаблон
if (!fs.existsSync(templatePath)) {
  console.error('❌ ОШИБКА: firebase-config.js.template не найден!');
  process.exit(1);
}

console.log('📄 Загружаю шаблон...');
let template = fs.readFileSync(templatePath, 'utf8');

// Требуемые переменные
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

console.log('\n🔍 Проверка переменных окружения:');
console.log('-'.repeat(40));

let allVarsExist = true;
const replacements = {};

requiredVars.forEach(varName => {
  const value = process.env[varName];
  
  if (!value) {
    console.error(`❌ ${varName}: ОТСУТСТВУЕТ`);
    allVarsExist = false;
  } else {
    // Маскируем для логов
    const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    console.log(`✅ ${varName}: ${masked}`);
    replacements[`{{${varName}}}`] = value;
  }
});

if (!allVarsExist) {
  console.error('\n❌ НЕ ВСЕ ПЕРЕМЕННЫЕ НАЙДЕНЫ!');
  console.error('Проверьте GitHub Secrets в Settings → Secrets and variables → Actions');
  process.exit(1);
}

console.log('\n🔄 Замена переменных в шаблоне...');
let config = template;

Object.entries(replacements).forEach(([placeholder, value]) => {
  config = config.replace(new RegExp(placeholder, 'g'), value);
});

// Сохраняем
fs.writeFileSync(outputPath, config, 'utf8');
console.log('✅ Файл создан: firebase-config.js');

// Проверяем
console.log('\n🔍 Финальная проверка:');
console.log('-'.repeat(40));

const generated = fs.readFileSync(outputPath, 'utf8');

// Проверка 1: Нет плейсхолдеров
if (generated.includes('{{')) {
  console.error('❌ В файле остались плейсхолдеры!');
  process.exit(1);
}
console.log('✅ Плейсхолдеры заменены');

// Проверка 2: Ключевые слова есть
const keywords = ['firebaseConfig', 'apiKey', 'projectId', 'databaseURL'];
keywords.forEach(word => {
  if (!generated.includes(word)) {
    console.error(`❌ Отсутствует ключевое слово: ${word}`);
    process.exit(1);
  }
});
console.log('✅ Найдены все ключевые слова');

// Проверка 3: Не пустые значения
if (generated.includes('""') || generated.includes("''")) {
  console.error('❌ В файле пустые значения!');
  process.exit(1);
}
console.log('✅ Нет пустых значений');

console.log('\n================================');
console.log('🎉 КОНФИГУРАЦИЯ ГОТОВА!');
console.log('================================\n');

console.log('📋 Первые 15 строк firebase-config.js:');
console.log('-'.repeat(40));
console.log(generated.split('\n').slice(0, 15).join('\n'));
console.log('...\n');

console.log('✅ Файл firebase-config.js успешно сгенерирован');
console.log('🚀 Готово к деплою на GitHub Pages');
