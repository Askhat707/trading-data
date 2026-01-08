// 🔥 ЛОКАЛЬНАЯ КОНФИГУРАЦИЯ FIREBASE (ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ)
// ⚠️ ЭТОТ ФАЙЛ ДЛЯ ТЕСТИРОВАНИЯ ЛОКАЛЬНО!
// ⚠️ НА ПРОДАКШЕНЕ СОЗДАЕТСЯ АВТОМАТИЧЕСКИ GITHUB ACTIONS

const firebaseConfig = {
  apiKey: "TEST_API_KEY",
  authDomain: "TEST_PROJECT.firebaseapp.com",
  databaseURL: "https://TEST_PROJECT.firebasedatabase.app",
  projectId: "TEST_PROJECT",
  storageBucket: "TEST_PROJECT.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456",
  measurementId: "G-ABCDEF"
};

// Экспорт для глобального использования
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
}

console.log('⚠️  Локальная конфигурация Firebase загружена (ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ)');
console.log('   Для продакшена настройте GitHub Secrets и Workflow');
