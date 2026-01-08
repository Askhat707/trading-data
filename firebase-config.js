// 🔥 FIREBASE CONFIG - AUTO GENERATED FROM GITHUB SECRETS
// ⚠️ СОЗДАНО АВТОМАТИЧЕСКИ ПРИ ДЕПЛОЕ - НЕ РЕДАКТИРОВАТЬ!

console.log('🚀 Загрузка Firebase конфигурации из GitHub Secrets...');

const firebaseConfig = {
  apiKey: "{{FIREBASE_API_KEY}}",
  authDomain: "{{FIREBASE_AUTH_DOMAIN}}",
  databaseURL: "{{FIREBASE_DATABASE_URL}}",
  projectId: "{{FIREBASE_PROJECT_ID}}",
  storageBucket: "{{FIREBASE_STORAGE_BUCKET}}",
  messagingSenderId: "{{FIREBASE_MESSAGING_SENDER_ID}}",
  appId: "{{FIREBASE_APP_ID}}",
  measurementId: "{{FIREBASE_MEASUREMENT_ID}}"
};

console.log('📋 Проверка конфигурации Firebase:');
console.log('  - Проект:', firebaseConfig.projectId);
console.log('  - Database URL:', firebaseConfig.databaseURL);
console.log('  - Auth Domain:', firebaseConfig.authDomain);

// Проверка, что все ключи заменены (не содержат {{ }})
const hasPlaceholders = Object.values(firebaseConfig).some(value => 
  typeof value === 'string' && value.includes('{{')
);

if (hasPlaceholders) {
  console.error('❌ ОШИБКА: В конфигурации есть не подставленные переменные!');
  console.error('   Проверьте GitHub Secrets в репозитории:');
  console.error('   Settings → Secrets and variables → Actions');
  console.error('   Нужно добавить все FIREBASE_* секреты');
} else {
  console.log('✅ Все переменные конфигурации заменены реальными значениями');
}

// Экспорт для глобального использования
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
    console.log('✅ Firebase конфигурация сохранена в window.firebaseConfig');
}

console.log('🎯 Конфигурация Firebase готова к использованию');
