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
                            <div class="auth-logo">💎 АКТИВАЦИЯ PREMIUM</div>
                <div class="auth-subtitle">Полный доступ ко всем функциям терминала</div>
            </div>
            ${currentUser ? `
                <div style="background: rgba(255,215,0,0.1); border: 1px solid var(--gold); border-radius: 10px; padding: 15px; margin: 20px 0;">
                    <div style="color: var(--gold); font-weight: 700; margin-bottom: 5px;">👤 Ваш аккаунт:</div>
                    <div style="color: #fff;">${currentUser.email}</div>
                </div>
            ` : ''}
            <div style="margin: 30px 0; line-height: 1.6; color: #ccc;">
                <h3 style="color: var(--gold); margin-bottom: 20px;">📅 ВЫБЕРИТЕ ПЕРИОД ПОДПИСКИ:</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0;">
                    <div style="background: rgba(255, 215, 0, 0.1); border: 2px solid var(--gold); border-radius: 10px; padding: 20px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--gold); margin-bottom: 10px;">7 дней</div>
                        <div style="font-size: 2.5rem; font-weight: 900; color: #fff; margin-bottom: 15px;">$7</div>
                        <button class="auth-button" style="width: 100%;" onclick="initiatePayment(7, 7, '${currentUser?.email || ''}')">Выбрать</button>
                    </div>
                    <div style="background: rgba(255, 215, 0, 0.1); border: 2px solid var(--gold); border-radius: 10px; padding: 20px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--gold); margin-bottom: 10px;">14 дней</div>
                        <div style="font-size: 2.5rem; font-weight: 900; color: #fff; margin-bottom: 15px;">$12</div>
                        <button class="auth-button" style="width: 100%;" onclick="initiatePayment(14, 12, '${currentUser?.email || ''}')">Выбрать</button>
                    </div>
                    <div style="background: rgba(255, 215, 0, 0.1); border: 2px solid var(--gold); border-radius: 10px; padding: 20px; text-align: center; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 0; left: 0; right: 0; background: var(--gradient-gold); height: 4px;"></div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--gold); margin-bottom: 10px;">30 дней</div>
                        <div style="font-size: 2.5rem; font-weight: 900; color: #fff; margin-bottom: 15px;">$20</div>
                        <button class="auth-button" style="width: 100%;" onclick="initiatePayment(30, 20, '${currentUser?.email || ''}')">Выбрать</button>
                    </div>
                </div>
                
                <div style="background: rgba(0, 230, 118, 0.1); border: 1px solid var(--call); border-radius: 10px; padding: 15px; margin: 20px 0;">
                    <h4 style="color: var(--call); margin-bottom: 10px;">📱 СПОСОБ ОПЛАТЫ:</h4>
                    <div style="color: #fff; font-size: 1.1rem; margin-bottom: 5px;">1. Напишите в Telegram: <strong style="color: var(--gold);">@ASKHAT_1985</strong></div>
                </div>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                <button onclick="document.body.removeChild(document.getElementById('payment-modal'))" 
                        class="auth-button" style="background: rgba(255,23,68,0.2); color: var(--put);">
                    Закрыть
                </button>
                <button onclick="openTelegram()" 
                        class="auth-button" style="background: var(--gradient-gold); color: #000; font-weight: 800;">
                    📲 Открыть Telegram
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Инициализация оплаты
 */
function initiatePayment(days, amount, email) {
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) document.body.removeChild(paymentModal);
    
    const modal = document.createElement('div');
    modal.id = 'initiate-payment-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.95); backdrop-filter: blur(20px);
        display: flex; justify-content: center; align-items: center; z-index: 10001;
    `;
    
    modal.innerHTML = `
        <div class="auth-container" style="max-width: 600px; text-align: center;">
            <div class="auth-header">
                <div class="auth-logo">🚀 ЗАПРОС АКТИВАЦИИ PREMIUM</div>
                <div class="auth-subtitle">${days} дней - $${amount}</div>
            </div>
            
            <div style="margin: 30px 0;">
                <div style="font-size: 4rem; color: var(--gold); margin-bottom: 20px;">📱</div>
                <div style="font-size: 1.2rem; color: #fff; margin-bottom: 15px;">
                    Для оплаты и активации напишите в Telegram:
                </div>
                <div style="background: rgba(255, 215, 0, 0.1); border: 2px solid var(--gold); border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <div style="font-size: 1.8rem; font-weight: 800; color: var(--gold); margin-bottom: 10px;">@ASKHAT_1985</div>
                    <button class="auth-button secondary" onclick="copyToClipboard('@ASKHAT_1985')" style="width: 100%; margin-bottom: 10px;">
                        📋 Скопировать Telegram
                    </button>
                </div>
                
                <div style="background: rgba(0, 230, 118, 0.1); border: 1px solid var(--call); border-radius: 10px; padding: 15px; margin: 20px 0; text-align: left;">
                    <div style="color: var(--call); font-weight: 700; margin-bottom: 10px;">📝 ШАБЛОН СООБЩЕНИЯ:</div>
                    <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.9rem; color: #ccc; margin-bottom: 15px;" id="payment-message">
Здравствуйте! Хочу активировать PREMIUM подписку на Gold Options Pro v2.

Мой email: ${email}
Выбранный период: ${days} дней ($${amount})
Прошу предоставить реквизиты для оплаты.
                    </div>
                    <button class="auth-button secondary" onclick="copyPaymentMessage()" style="width: 100%;">
                        📋 Скопировать шаблон
                    </button>
                </div>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
                <button onclick="document.body.removeChild(document.getElementById('initiate-payment-modal'))" 
                        class="auth-button" style="background: rgba(255,23,68,0.2); color: var(--put);">
                    Отмена
                </button>
                <button onclick="openTelegram()" 
                        class="auth-button" style="background: var(--gradient-gold); color: #000; font-weight: 800;">
                    📲 Открыть Telegram
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Копирование сообщения для оплаты
 */
function copyPaymentMessage() {
    const messageElement = document.getElementById('payment-message');
    if (messageElement) {
        const text = messageElement.textContent;
        copyToClipboard(text);
    }
}

/**
 * Показ модального окна для триала
 */
function showTrialModal() {
    const modal = document.getElementById('trial-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * Скрытие модального окна для триала
 */
function hideTrialModal() {
    const modal = document.getElementById('trial-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Копирование email администратора
 */
function copyAdminEmail() {
    const email = document.getElementById('admin-email').textContent;
    copyToClipboard(email);
}

/**
 * Копирование Telegram администратора
 */
function copyTelegram() {
    const telegram = document.getElementById('admin-telegram').textContent;
    copyToClipboard(telegram);
}

/**
 * Копирование шаблона сообщения для триала
 */
function copyTemplate() {
    const template = document.getElementById('trial-message-template').textContent;
    copyToClipboard(template);
}

/**
 * Открытие Telegram для триала
 */
function openTelegramForTrial() {
    window.open('https://t.me/ASKHAT_1985', '_blank');
}

// Экспорт функций в глобальную область видимости
window.copyToClipboard = copyToClipboard;
window.showAboutModal = showAboutModal;
window.showTermsModal = showTermsModal;
window.showPrivacyModal = showPrivacyModal;
window.openTelegram = openTelegram;
window.showPaymentModal = showPaymentModal;
window.initiatePayment = initiatePayment;
window.copyPaymentMessage = copyPaymentMessage;
window.showTrialModal = showTrialModal;
window.hideTrialModal = hideTrialModal;
window.copyAdminEmail = copyAdminEmail;
window.copyTelegram = copyTelegram;
window.copyTemplate = copyTemplate;
window.openTelegramForTrial = openTelegramForTrial;
