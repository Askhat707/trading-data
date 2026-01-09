#!/usr/bin/env node

/**
 * Скрипт для проверки готовности деплоя с расширенными логами
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔍 РАСШИРЕННАЯ ПРОВЕРКА ГОТОВНОСТИ К ДЕПЛОЮ');
console.log('📅 Время проверки:', new Date().toISOString());
console.log('='.repeat(60));

// 1. Проверка файловой структуры
console.log('\n📁 ПРОВЕРКА ФАЙЛОВОЙ СТРУКТУРЫ:');
console.log('-'.repeat(40));

const requiredFiles = [
    { path: 'index.html', critical: true },
    { path: 'firebase-config.js', critical: true },
    { path: 'js/app.js', critical: true },
    { path: 'js/constants.js', critical: true },
    { path: 'js/modules/auth.js', critical: true },
    { path: 'js/modules/firebase.js', critical: true },
    { path: 'js/services/api.js', critical: true },
    { path: 'js/services/cache.js', critical: true },
    { path: 'css/base.css', critical: true },
    { path: 'service-worker.js', critical: true },
    { path: '.github/workflows/deploy.yml', critical: true },
];

let allFilesExist = true;
let criticalErrors = [];

requiredFiles.forEach(item => {
    const filePath = path.join(__dirname, '..', item.path);
    
    if (fs.existsSync(filePath)) {
        try {
            const stats = fs.statSync(filePath);
            const size = stats.size;
            const hash = crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex').substring(0, 8);
            
            console.log(`✅ ${item.path} (${size} байт, хэш: ${hash})`);
            
            // Особые проверки для критических файлов
            if (item.path === 'firebase-config.js') {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Проверяем наличие плейсхолдеров
                const hasPlaceholders = content.includes('{{') || content.includes('}}');
                const hasSecretVariables = content.includes('FIREBASE_API_KEY') || 
                                       content.includes('secrets.FIREBASE');
                
                if (hasPlaceholders) {
                    console.error(`   ❌ КРИТИЧЕСКАЯ ОШИБКА: ${item.path} содержит плейсхолдеры {{}}`);
                    console.error(`   Первые 500 символов:`, content.substring(0, 500));
                    criticalErrors.push(`${item.path} содержит плейсхолдеры`);
                }
                
                if (hasSecretVariables) {
                    console.error(`   ❌ КРИТИЧЕСКАЯ ОШИБКА: ${item.path} содержит переменные FIREBASE_*`);
                    console.error(`   Это значит, что GitHub Secrets не подставились`);
                    criticalErrors.push(`${item.path} содержит переменные FIREBASE_*`);
                }
                
                // Проверяем структуру
                if (!content.includes('const firebaseConfig = {')) {
                    console.error(`   ❌ КРИТИЧЕСКАЯ ОШИБКА: ${item.path} не содержит firebaseConfig`);
                    criticalErrors.push(`${item.path} не содержит firebaseConfig`);
                }
                
                // Проверяем наличие реальных значений
                if (!content.includes('apiKey: "AIza') && !content.includes('apiKey: "AIza')) {
                    console.warn(`   ⚠️  API ключ может быть в неверном формате. Ожидается "AIza..."`);
                }
                
                if (content.includes('projectId: ""')) {
                    console.error(`   ❌ projectId пустой!`);
                    criticalErrors.push(`projectId пустой в ${item.path}`);
                }
            }
            
        } catch (error) {
            console.error(`   ❌ Ошибка чтения ${item.path}: ${error.message}`);
            if (item.critical) {
                criticalErrors.push(`Ошибка чтения ${item.path}: ${error.message}`);
            }
        }
    } else {
        if (item.critical) {
            console.error(`❌ КРИТИЧЕСКИЙ ФАЙЛ ОТСУТСТВУЕТ: ${item.path}`);
            criticalErrors.push(`Отсутствует файл: ${item.path}`);
            allFilesExist = false;
        } else {
            console.log(`⚠️  Файл отсутствует (не критично): ${item.path}`);
        }
    }
});

// 2. Проверка переменных окружения
console.log('\n🔐 ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ:');
console.log('-'.repeat(40));

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

let envVarsStatus = '⚠️  Проверьте вручную в GitHub Secrets';

requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    
    if (value) {
        const maskedValue = value.length > 15 
            ? value.substring(0, 5) + '...' + value.substring(value.length - 5)
            : '***';
        
        console.log(`✅ ${envVar}: присутствует (${maskedValue})`);
        
        // Проверка формата
        if (envVar === 'FIREBASE_API_KEY' && !value.startsWith('AIza')) {
            console.warn(`   ⚠️  API ключ может быть в неверном формате. Ожидается "AIza..."`);
        }
        
        if (envVar === 'FIREBASE_DATABASE_URL' && !value.startsWith('https://')) {
            console.error(`   ❌ Database URL должен начинаться с https://`);
            criticalErrors.push(`Неверный формат Database URL`);
        }
        
        envVarsStatus = '✅ Найдены в окружении';
    } else {
        console.error(`❌ ${envVar}: НЕ НАЙДЕН в окружении`);
        criticalErrors.push(`Отсутствует переменная окружения: ${envVar}`);
        envVarsStatus = '❌ НЕ НАЙДЕНЫ в окружении';
    }
});

console.log(`\n📊 Статус переменных окружения: ${envVarsStatus}`);

// 3. Проверка GitHub Actions workflow
console.log('\n⚙️ ПРОВЕРКА GITHUB ACTIONS WORKFLOW:');
console.log('-'.repeat(40));

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'deploy.yml');
if (fs.existsSync(workflowPath)) {
    try {
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');
        
        // Проверяем наличие ключевых секций
        const checks = [
            { name: 'Название workflow', test: /name:/, required: true },
            { name: 'Триггер на push', test: /on:\s*\n\s*push:/, required: true },
            { name: 'Переменные окружения', test: /env:/, required: true },
            { name: 'Проверка секретов', test: /Validate Secrets/, required: true },
            { name: 'Генерация конфига', test: /Generate Firebase Config/, required: true },
            { name: 'Деплой на Pages', test: /deploy-pages/, required: true }
        ];
        
        checks.forEach(check => {
            if (check.test.test(workflowContent)) {
                console.log(`✅ ${check.name}`);
            } else if (check.required) {
                console.error(`❌ Отсутствует: ${check.name}`);
                criticalErrors.push(`В workflow отсутствует: ${check.name}`);
            }
        });
        
        // Проверяем, что используется cat для генерации конфига, а не старый скрипт
        if (!workflowContent.includes('cat > firebase-config.js')) {
            console.warn('⚠️  В workflow используется старый метод генерации конфига');
            console.warn('   Рекомендуется использовать метод с cat для прямой подстановки');
        }
        
        console.log('✅ Файл workflow найден и проверен');
        
    } catch (error) {
        console.error(`❌ Ошибка чтения workflow: ${error.message}`);
        criticalErrors.push(`Ошибка чтения workflow: ${error.message}`);
    }
} else {
    console.error('❌ Файл workflow не найден: .github/workflows/deploy.yml');
    criticalErrors.push('Отсутствует файл workflow');
}

// 4. Итоговая проверка
console.log('\n' + '='.repeat(60));
console.log('📊 ИТОГОВАЯ ПРОВЕРКА:');
console.log('='.repeat(60));

if (criticalErrors.length === 0) {
    console.log('🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО!');
    console.log('');
    console.log('🚀 ГОТОВО К ДЕПЛОЮ!');
    console.log('');
    console.log('📋 ИНСТРУКЦИЯ:');
    console.log('1. git add .');
    console.log('2. git commit -m "fix: Исправление генерации firebase-config.js"');
    console.log('3. git push origin main');
    console.log('');
    console.log('🌐 После деплоя сайт будет доступен по адресу:');
    console.log('   https://askhat707.github.io/trading-data/');
    console.log('');
    console.log('🔍 ДЛЯ ОТЛАДКИ:');
    console.log('   - Откройте https://askhat707.github.io/trading-data/firebase-config.js');
    console.log('   - Должны увидеть реальные значения Firebase, а не плейсхолдеры');
    console.log('   - Откройте консоль браузера (F12) на странице приложения');
    console.log('   - Должны появиться сообщения о загрузке Firebase конфигурации');
} else {
    console.error('❌ ОБНАРУЖЕНЫ КРИТИЧЕСКИЕ ОШИБКИ:');
    criticalErrors.forEach((error, index) => {
        console.error(`   ${index + 1}. ${error}`);
    });
    console.log('');
    console.log('🔧 НЕОБХОДИМО ИСПРАВИТЬ ОШИБКИ ПЕРЕД ДЕПЛОЕМ');
    console.log('');
    console.log('💡 РЕКОМЕНДАЦИИ:');
    console.log('1. Убедитесь что все 8 секретов добавлены в GitHub Secrets');
    console.log('2. Удалите старый firebase-config.js.template файл');
    console.log('3. Проверьте что workflow файл deploy.yml корректен');
    
    process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('✅ ПРОВЕРКА ЗАВЕРШЕНА');
console.log('='.repeat(60));
