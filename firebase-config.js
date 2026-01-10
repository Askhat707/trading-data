// ============================================
// 🔥 FIREBASE CONFIG - АВТОГЕНЕРИРУЕТСЯ
// ============================================

console.log('🚀 Загрузка Firebase конфигурации...');

// Конфиг загружается автоматически из GitHub Secrets через Deploy Workflow
// Переменные подставляются из .github/workflows/deploy.yml

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_FROM_SECRETS",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

console.group('📊 Firebase Configuration Loaded:');
console.log('✅ Project:', firebaseConfig.projectId);
console.log('✅ Auth Domain:', firebaseConfig.authDomain);
console.log('✅ Database URL:', firebaseConfig.databaseURL);
console.groupEnd();

window.firebaseConfig = firebaseConfig;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
