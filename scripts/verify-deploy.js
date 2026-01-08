#!/usr/bin/env node

/**
 * Скрипт для проверки деплоя
 * Запуск: node scripts/verify-deploy.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка файлов для деплоя...\n');

// Проверяемые файлы
const requiredFiles = [
    'index.html',
    'firebase-config.js.template',
    'js/modules/auth.js',
    'js/app.js',
    'css/base.css',
    '.github/workflows/deploy.yml'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - НЕ НАЙДЕН!`);
        allFilesExist = false;
    }
});

console.log('\n📁 Проверка структуры:');
const directories = [
    'js/modules',
    'js/services', 
    'js/utils',
    'css/components',
    'css/pages',
    '.github/workflows'
];

directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath)) {
        console.log(`✅ ${dir}/`);
    } else {
        console.log(`❌ ${dir}/ - НЕ СУЩЕСТВУЕТ!`);
        allFilesExist = false;
    }
});

console.log('\n⚙️  Проверка GitHub Secrets (нужно настроить вручную):');
const requiredSecrets = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_DATABASE_URL',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'FIREBASE_MEASUREMENT_ID'
];

requiredSecrets.forEach(secret => {
    console.log(`   - ${secret}`);
});

if (allFilesExist) {
    console.log('\n✅ Все необходимые файлы найдены!');
    console.log('\n📋 Инструкция по деплою:');
    console.log('1. Добавьте все Firebase Secrets в GitHub:');
    console.log('   - Settings → Secrets and variables → Actions');
    console.log('   - Добавьте все 8 секретов из списка выше');
    console.log('');
    console.log('2. Запустите деплой:');
    console.log('   - Перейдите в Actions → Deploy Trading Data Terminal → Run workflow');
    console.log('');
    console.log('3. Проверьте деплой:');
    console.log('   - Откройте https://askhat707.github.io/trading-data/');
    console.log('   - Нажмите F12 → Console');
    console.log('   - Должны быть сообщения об успешной загрузке');
} else {
    console.log('\n❌ Некоторые файлы отсутствуют!');
    console.log('   Исправьте структуру и попробуйте снова.');
    process.exit(1);
}
