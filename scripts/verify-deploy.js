#!/usr/bin/env node

/**
 * Скрипт для проверки готовности деплоя
 * Запуск: node scripts/verify-deploy.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔍 Проверка готовности к деплою...\n');
console.log('📅 Время проверки:', new Date().toISOString());
console.log('');

// 1. Проверка файловой структуры
console.log('📁 Проверка файловой структуры:');
const requiredFiles = [
    'index.html',
    'firebase-config.js',
    'js/app.js',
    'js/constants.js',
    'js/modules/auth.js',
    'js/modules/firebase.js',
    'js/services/api.js',
    'js/services/cache.js',
    'css/base.css',
    'service-worker.js',
    '.github/workflows/deploy.yml'
];

let allFilesExist = true;
let fileErrors = [];

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const size = stats.size;
        console.log(`✅ ${file} (${size} bytes)`);
        
        // Проверяем firebase-config.js на наличие переменных
        if (file === 'firebase-config.js') {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('{{') || content.includes('FIREBASE_') || content.includes('secrets.')) {
                console.error(`   ⚠️  ВНИМАНИЕ: ${file} содержит переменные!`);
                console.error(`   Должны быть реальные значения из GitHub Secrets`);
                fileErrors.push(`${file} содержит переменные вместо реальных значений`);
            } else if (content.includes('TEST_')) {
                console.error(`   ⚠️  ВНИМАНИЕ: ${file} содержит тестовые значения!`);
                fileErrors.push(`${file} содержит тестовые значения`);
            }
        }
    } else {
        console.error(`❌ ${file} - НЕ НАЙДЕН!`);
        allFilesExist = false;
        fileErrors.push(`Отсутствует файл: ${file}`);
    }
});

console.log('');

// 2. Проверка папок
console.log('📂 Проверка структуры папок:');
const requiredDirs = [
    'js/modules',
    'js/services',
    'js/utils',
    'css/components',
    'css/pages',
    'scripts',
    '.github/workflows'
];

requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        console.log(`✅ ${dir}/`);
    } else {
        console.error(`❌ ${dir}/ - НЕ СУЩЕСТВУЕТ!`);
        allFilesExist = false;
        fileErrors.push(`Отсутствует папка: ${dir}`);
    }
});

console.log('');

// 3. Проверка package.json
console.log('📦 Проверка package.json:');
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
    try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        console.log(`✅ package.json найден`);
        console.log(`   Имя: ${pkg.name || 'Не указано'}`);
        console.log(`   Версия: ${pkg.version || 'Не указана'}`);
        console.log(`   Скрипты: ${Object.keys(pkg.scripts || {}).length}`);
    } catch (e) {
        console.error(`❌ Ошибка чтения package.json: ${e.message}`);
        fileErrors.push(`Ошибка в package.json: ${e.message}`);
    }
} else {
    console.log(`⚠️  package.json не найден (необязательный файл)`);
}

console.log('');

// 4. Проверка GitHub Secrets (имитация)
console.log('🔐 Проверка необходимых переменных окружения:');
const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_DATABASE_URL',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'FIREBASE_MEASUREMENT_ID'
];

let envStatus = '⚠️  Проверьте вручную в GitHub Secrets';

requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
        const maskedValue = process.env[envVar].substring(0, 5) + '...' + 
                           process.env[envVar].substring(process.env[envVar].length - 5);
        console.log(`✅ ${envVar}: ${maskedValue}`);
        envStatus = '✅ Найдены в окружении';
    } else {
        console.log(`❌ ${envVar}: НЕ НАЙДЕН в окружении`);
        envStatus = '❌ НЕ НАЙДЕНЫ в окружении';
    }
});

console.log('');
console.log(`Статус переменных окружения: ${envStatus}`);

console.log('');

// 5. Итоговая проверка
console.log('📊 ИТОГОВАЯ ПРОВЕРКА:');

if (allFilesExist && fileErrors.length === 0) {
    console.log('✅ Все проверки пройдены успешно!');
    console.log('');
    console.log('🎯 Готово к деплою!');
    console.log('Для запуска деплоя:');
    console.log('1. Закоммитьте изменения: git add . && git commit -m "prepare for deploy"');
    console.log('2. Запушьте в репозиторий: git push origin main');
    console.log('3. Или запустите workflow вручную в GitHub Actions');
    console.log('');
    console.log('🌐 После деплоя сайт будет доступен по адресу:');
    console.log('   https://askhat707.github.io/trading-data/');
} else {
    console.error('❌ Обнаружены ошибки:');
    fileErrors.forEach(error => console.error(`   - ${error}`));
    console.log('');
    console.log('🔧 Необходимо исправить ошибки перед деплоем');
    process.exit(1);
}

console.log('');
console.log('🔍 Для проверки Firebase конфигурации:');
console.log('   Откройте index.html в браузере → F12 → Console');
console.log('   Должны появиться сообщения о загрузке конфигурации');
