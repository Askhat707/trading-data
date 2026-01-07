// ============================================
// 📋 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Копирование текста в буфер обмена
 * @param {string} text - Текст для копирования
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        if (window.app && window.app.showNotification) {
            app.showNotification(`Скопировано: ${text}`, 'success');
        } else {
            console.log('Скопировано:', text);
        }
    }).catch(err => {
        console.error('Ошибка копирования: ', err);
        if (window.app && window.app.showNotification) {
            app.showNotification('Ошибка копирования', 'error');
        }
    });
}

/**
 * Показ модального окна "О программе"
 */
function showAboutModal() {
    const modal = document.createElement('div');
    modal.id = 'about-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.95); backdrop-filter: blur(20px);
        display: flex; justify-content: center; align-items: center; z-index: 10001;
        overflow-y: auto; padding: 20px;
    `;
    
    modal.innerHTML = `
        <div class="auth-container" style="max-width: 1000px; max-height: 95vh; overflow-y: auto;">
            <div class="auth-header">
                <div class="auth-logo">⚡ GOLD OPTIONS PRO v2</div>
                <div class="auth-subtitle">Professional Trading Terminal</div>
            </div>
            
            <div style="margin: 30px 0; line-height: 1.8; color: #ccc; text-align: left;">
                <h3 style="color: var(--gold); margin-bottom: 15px;">🎯 О ПРОГРАММЕ</h3>
                <p style="margin-bottom: 15px;">
                    <strong>Gold Options Pro v2</strong> - профессиональный торговый терминал для анализа опционных данных 
                    золота (XAU/USD) с Чикагской товарной биржи (CME).
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button onclick="document.body.removeChild(document.getElementById('about-modal'))" 
                            class="auth-button">
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Закрытие по клику вне окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
}

/**
 * Показ модального окна условий использования
 */
function showTermsModal() {
    const modal = document.createElement('div');
    modal.id = 'terms-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(20px);
        display: flex; justify-content: center; align-items: center; z-index: 10001;
        overflow-y: auto; padding: 20px;
    `;
    
    // Содержимое модального окна...
    // (Упрощённая версия для примера)
    modal.innerHTML = `
        <div class="auth-container" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div class="auth-header">
                <div class="auth-logo">📜 УСЛОВИЯ ИСПОЛЬЗОВАНИЯ</div>
            </div>
            <div style="margin: 30px 0;">
                <p style="color: #ccc;">Условия использования терминала...</p>
            </div>
            <div style="text-align: center;">
                <button onclick="document.body.removeChild(document.getElementById('terms-modal'))" 
                        class="auth-button">
                    Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Показ модального окна политики конфиденциальности
 */
function showPrivacyModal() {
    const modal = document.createElement('div');
    modal.id = 'privacy-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(20px);
        display: flex; justify-content: center; align-items: center; z-index: 10001;
        overflow-y: auto; padding: 20px;
    `;
    
    modal.innerHTML = `
        <div class="auth-container" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div class="auth-header">
                <div class="auth-logo">🔒 ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</div>
            </div>
            <div style="margin: 30px 0;">
                <p style="color: #ccc;">Политика конфиденциальности терминала...</p>
            </div>
            <div style="text-align: center;">
                <button onclick="document.body.removeChild(document.getElementById('privacy-modal'))" 
                        class="auth-button">
                    Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Открытие Telegram
 */
function openTelegram() {
    window.open('https://t.me/ASKHAT_1985', '_blank');
}

/**
 * Показ модального окна для оплаты
 */
function showPaymentModal(user = null) {
    const currentUser = user || (window.AuthSystem ? AuthSystem.currentUser : null);
    const modal = document.createElement('div');
    modal.id = 'payment-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(20px);
        display: flex; justify-content: center; align-items: center; z-index: 10000;
    `;
    
    // Упрощённое содержимое
    modal.innerHTML = `
        <div class="auth-container" style="max-width: 600px;">
            <div class="auth-header">
