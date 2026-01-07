// ============================================
// 📋 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Копирование текста в буфер обмена
 */
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        if (window.app && window.app.showNotification) {
            app.showNotification(`Скопировано: ${text}`, 'success');
        } else {
            console.log('Скопировано:', text);
        }
    }).catch(err => {
        console.error('Ошибка копирования:', err);
    });
};

/**
 * Обработка входа
 */
window.handleLogin = function() {
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    const termsChecked = document.getElementById('terms-checkbox').checked;
    
    if (!email || !password) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    if (!termsChecked) {
        alert('Пожалуйста, согласитесь с условиями использования');
        return;
    }
    
    if (window.AuthModule) {
        AuthModule.login(email, password);
    }
};

/**
 * Обработка регистрации
 */
window.handleRegister = function() {
    alert('Функция регистрации будет доступна вскоре!');
};

/**
 * Показ модального окна оплаты
 */
window.showPaymentModal = function(user = null) {
    const currentUser = user || (window.AuthModule ? AuthModule.currentUser : null);
    const modal = document.createElement('div');
    modal.id = 'payment-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(20px);
        display: flex; justify-content: center; align-items: center; z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div class="auth-container" style="max-width: 600px;">
            <div class="auth-header">
                <div class="auth-logo">💎 АКТИВАЦИЯ PREMIUM</div>
                <div class="auth-subtitle">Полный доступ ко всем функциям терминала</div>
            </div>
            <div style="margin: 30px 0;">
                <button onclick="openTelegram()" class="auth-button" style="width: 100%;">
                    📲 Написать в Telegram
                </button>
                <button onclick="document.body.removeChild(document.getElementById('payment-modal'))" 
                        class="auth-button secondary" style="margin-top: 10px; width: 100%;">
                    Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

console.log('✅ Вспомогательные функции загружены');
