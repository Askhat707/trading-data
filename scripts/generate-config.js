#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 ЗАПУСК: Генерация firebase-config.js');

// 1. Определение путей
const templatePath = path.join(__dirname, '../firebase-config.js.template');
const outputPath = path.join(__dirname, '../firebase-config.js');

// 2. Проверка наличия шаблона
if (!fs.existsSync(templatePath)) {
  console.error('❌ ОШИБКА: Файл firebase-config.js.template не найден!');
  console.error('Поиск по пути:', templatePath);
  process.exit(1);
}

// 3. Чтение шаблона
let configContent = fs.readFileSync(templatePath, 'utf8');

// 4. Список секретов (ключ в шаблоне -> переменная окружения)
const secretsMap = {
  '{{FIREBASE_API_KEY}}': process.env.FIREBASE_API_KEY,
  '{{FIREBASE_AUTH_DOMAIN}}': process.env.FIREBASE_AUTH_DOMAIN,
  '{{FIREBASE_DATABASE_URL}}': process.env.FIREBASE_DATABASE_URL,
  '{{FIREBASE_PROJECT_ID}}': process.env.FIREBASE_PROJECT_ID,
  '{{FIREBASE_STORAGE_BUCKET}}': process.env.FIREBASE_STORAGE_BUCKET,
  '{{FIREBASE_MESSAGING_SENDER_ID}}': process.env.FIREBASE_MESSAGING_SENDER_ID,
  '{{FIREBASE_APP_ID}}': process.env.FIREBASE_APP_ID,
  '{{FIREBASE_MEASUREMENT_ID}}': process.env.FIREBASE_MEASUREMENT_ID
};

// 5. Безопасная замена
let missingKeys = false;

Object.entries(secretsMap).forEach(([placeholder, value]) => {
  if (!value) {
    console.error(`❌ ОШИБКА: Секрет для ${placeholder} не найден в ENV!`);
    console.error(`   Значение: ${value}`);
    missingKeys = true;
  } else {
    // split().join() безопаснее replace() для спецсимволов
    configContent = configContent.split(placeholder).join(value);
    console.log(`✅ Заменен ${placeholder.substring(0, 15)}...`);
  }
});

if (missingKeys) {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Не все секреты найдены!');
  console.error('   Проверьте GitHub Secrets в настройках репозитория');
  process.exit(1);
}

// 6. Сохранение
fs.writeFileSync(outputPath, configContent, 'utf8');
console.log('✅ УСПЕХ: Файл firebase-config.js создан.');
console.log('   Путь:', outputPath);
console.log('   Размер:', configContent.length, 'байт');

// 7. Проверка валидности (базовая)
if (configContent.includes('{{')) {
    console.error('❌ ОШИБКА: В файле остались незамененные шаблоны!');
    console.error('   Содержание:', configContent.substring(0, 500));
    process.exit(1);
}

// 8. Дополнительная проверка - создаем тестовый файл
const testPath = path.join(__dirname, '../config-test.txt');
fs.writeFileSync(testPath, `Конфиг создан: ${new Date().toISOString()}\nСекреты заменены: ${!missingKeys}`);
console.log('📝 Тестовый файл создан: config-test.txt');

console.log('🚀 Готово к работе.');
