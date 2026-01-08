#!/usr/bin/env node

/**
 * Скрипт для проверки GitHub Secrets
 * Запускать локально: node scripts/check-secrets.js
 */

console.log('🔍 Проверка конфигурации Firebase...\n');

// Ожидаемые Secrets
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

console.log('📋 Требуемые Secrets:');
requiredSecrets.forEach(secret => {
    console.log(`   - ${secret}`);
});

console.log('\n📝 Инструкция по настройке:');
console.log('1. Перейдите в репозиторий на GitHub');
console.log('2. Нажмите Settings → Secrets and variables → Actions');
console.log('3. Нажмите "New repository secret"');
console.log('4. Добавьте все 8 секретов из списка выше');
console.log('5. Значения берите из Firebase Console:');
console.log('   - Проект: trading-data-pro (или ваш проект)');
console.log('   - Настройки проекта → Ваши приложения → Веб-приложение');

console.log('\n🔧 Пример firebase-config.js после подстановки:');
console.log(`
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "trading-data-pro.firebaseapp.com",
  databaseURL: "https://trading-data-pro-default-rtdb.firebaseio.com",
  projectId: "trading-data-pro",
  storageBucket: "trading-data-pro.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456",
  measurementId: "G-ABCDEF"
};
`);

console.log('\n✅ После добавления всех Secrets:');
console.log('   - Запустите workflow вручную (Actions → Deploy Trading Data Terminal → Run workflow)');
console.log('   - Или сделайте push в ветку main');
