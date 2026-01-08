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
 * Показ модального окна "О программе" (ПОЛНАЯ ВЕРСИЯ СО ВСЕМИ ДАННЫМИ)
 */
function showAboutModal() {
    // 1. Создаем контейнер
    const modal = document.createElement('div');
    modal.id = 'about-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.95); backdrop-filter: blur(15px);
        display: flex; justify-content: center; align-items: center; z-index: 10001;
        overflow-y: auto; padding: 20px;
    `;
    
    // 2. Наполняем контентом (HTML)
    modal.innerHTML = `
        <div class="auth-container" style="max-width: 1000px; width: 100%; max-height: 95vh; overflow-y: auto; border: 1px solid var(--gold); box-shadow: 0 0 50px rgba(255, 215, 0, 0.15); padding: 40px; background: #050505;">
            
            <!-- ЗАГОЛОВОК -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">⚡</div>
                <h1 style="font-size: 2.5rem; font-weight: 900; background: linear-gradient(135deg, #FFD700, #D4AF37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">GOLD OPTIONS PRO V2</h1>
                <div style="color: #666; font-size: 0.9rem; margin-top: 5px; letter-spacing: 2px; text-transform: uppercase;">Professional Trading Terminal</div>
            </div>
            
            <div style="text-align: left;">
                
                <!-- О ПРОГРАММЕ -->
                <h3 style="color: var(--gold); margin-bottom: 15px; display: flex; align-items: center; gap: 10px; font-size: 1.2rem;">
                    🎯 О ПРОГРАММЕ
                </h3>
                <p style="color: #ccc; line-height: 1.6; margin-bottom: 30px; font-size: 1rem;">
                    <strong>Gold Options Pro v2</strong> - профессиональный торговый терминал для анализа опционных данных золота (XAU/USD) с Чикагской товарной биржи (CME).
                </p>

                <!-- ОСНОВНЫЕ ВОЗМОЖНОСТИ -->
                <h3 style="color: var(--gold); margin-bottom: 15px; display: flex; align-items: center; gap: 10px; font-size: 1.2rem;">
                    🚀 ОСНОВНЫЕ ВОЗМОЖНОСТИ
                </h3>
                <ul style="list-style: none; padding: 0; margin-bottom: 30px; color: #bbb; line-height: 1.8;">
                    <li>📊 <strong style="color: #fff;">Live данные</strong> - реальные цены и объемы с CME</li>
                    <li>📈 <strong style="color: #fff;">Расширенная аналитика</strong> - Max Pain, Expected Move, Zero Gamma</li>
                    <li>📉 <strong style="color: #fff;">Визуализация</strong> - 8 интерактивных графиков</li>
                    <li>📋 <strong style="color: #fff;">Option Chain таблица</strong> - полные данные по страйкам</li>
                    <li>🤖 <strong style="color: #fff;">MT5 интеграция</strong> - автоматические торговые сигналы</li>
                    <li>🎯 <strong style="color: #fff;">Топ статистика</strong> - лучшие страйки и безубытки</li>
                    <li>⚡ <strong style="color: #fff;">Real-time обновления</strong> - каждые 3 секунды</li>
                </ul>

                <!-- ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ -->
                <h3 style="color: var(--gold); margin-bottom: 15px; display: flex; align-items: center; gap: 10px; font-size: 1.2rem;">
                    🔧 ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ
                </h3>
                <div style="background: #111; padding: 20px; border-radius: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; border: 1px solid #222;">
                    <div>
                        <div style="color: #666; font-size: 0.8rem; text-transform: uppercase;">Версия</div>
                        <div style="color: #fff; font-weight: 700;">v2.0 Professional</div>
                    </div>
                    <div>
                        <div style="color: #666; font-size: 0.8rem; text-transform: uppercase;">База данных</div>
                        <div style="color: #fff; font-weight: 700;">Firebase Realtime</div>
                    </div>
                    <div>
                        <div style="color: #666; font-size: 0.8rem; text-transform: uppercase;">Источник данных</div>
                        <div style="color: #fff; font-weight: 700;">CME Group</div>
                    </div>
                    <div>
                        <div style="color: #666; font-size: 0.8rem; text-transform: uppercase;">Обновление</div>
                        <div style="color: #fff; font-weight: 700;">Каждые 3 секунды</div>
                    </div>
                </div>

                <!-- ДЛЯ КОГО ЭТОТ ТЕРМИНАЛ -->
                <h3 style="color: var(--gold); margin-bottom: 15px; display: flex; align-items: center; gap: 10px; font-size: 1.2rem;">
                    👥 ДЛЯ КОГО ЭТОТ ТЕРМИНАЛ?
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 40px;">
                    <div style="background: rgba(255, 215, 0, 0.05); padding: 20px; border-radius: 10px; border: 1px solid rgba(255, 215, 0, 0.2);">
                        <div style="color: var(--gold); font-weight: 700; margin-bottom: 5px;">📊 Трейдеры</div>
                        <div style="font-size: 0.85rem; color: #888;">Анализ опционных данных для принятия торговых решений</div>
                    </div>
                    <div style="background: rgba(255, 215, 0, 0.05); padding: 20px; border-radius: 10px; border: 1px solid rgba(255, 215, 0, 0.2);">
                        <div style="color: var(--gold); font-weight: 700; margin-bottom: 5px;">📈 Аналитики</div>
                        <div style="font-size: 0.85rem; color: #888;">Исследование рыночных тенденций и настроений</div>
                    </div>
                    <div style="background: rgba(255, 215, 0, 0.05); padding: 20px; border-radius: 10px; border: 1px solid rgba(255, 215, 0, 0.2);">
                        <div style="color: var(--gold); font-weight: 700; margin-bottom: 5px;">🤖 Алготрейдеры</div>
                        <div style="font-size: 0.85rem; color: #888;">Интеграция с MT5 для автоматической торговли</div>
                    </div>
                </div>

                <!-- КОНТАКТЫ И ПОДДЕРЖКА -->
                <h3 style="color: var(--put); margin-bottom: 15px; display: flex; align-items: center; gap: 10px; font-size: 1.2rem;">
                    📞 КОНТАКТЫ И ПОДДЕРЖКА
                </h3>
                <div style="border: 1px solid var(--gold); border-radius: 15px; padding: 25px; margin-bottom: 30px; background: rgba(255, 215, 0, 0.02);">
                    
                    <!-- EMAIL -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        <div style="color: #fff; font-size: 0.95rem;">
                            📧 <span style="color: var(--gold); font-weight: 700;">Email для оплаты:</span> omaralinovaskar95@gmail.com
                        </div>
                        <button onclick="copyToClipboard('omaralinovaskar95@gmail.com')" style="background: #222; border: 1px solid #444; color: #888; padding: 5px 15px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: 0.3s;" onmouseover="this.style.borderColor='var(--gold)'; this.style.color='#fff'" onmouseout="this.style.borderColor='#444'; this.style.color='#888'">
                            КОПИРОВАТЬ
                        </button>
                    </div>

                    <!-- TRC20 -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        <div style="color: #fff; font-size: 0.95rem; word-break: break-all;">
                            🔗 <span style="color: var(--gold); font-weight: 700;">USDT (TRC20):</span> TQ7LLoSwTzUyHox4rkXjZyfkvE9Wcoy5A4
                        </div>
                        <button onclick="copyToClipboard('TQ7LLoSwTzUyHox4rkXjZyfkvE9Wcoy5A4')" style="background: #222; border: 1px solid #444; color: #888; padding: 5px 15px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: 0.3s;" onmouseover="this.style.borderColor='var(--gold)'; this.style.color='#fff'" onmouseout="this.style.borderColor='#444'; this.style.color='#888'">
                            КОПИРОВАТЬ
                        </button>
                    </div>

                    <!-- TON -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        <div style="color: #fff; font-size: 0.95rem; word-break: break-all;">
                            🔗 <span style="color: var(--gold); font-weight: 700;">USDT (TON):</span> UQDLbRtRSfxSK-I5QGW3Wu-q5PxCAo_IdwAD6iM349ylmtuH
                        </div>
                        <button onclick="copyToClipboard('UQDLbRtRSfxSK-I5QGW3Wu-q5PxCAo_IdwAD6iM349ylmtuH')" style="background: #222; border: 1px solid #444; color: #888; padding: 5px 15px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: 0.3s;" onmouseover="this.style.borderColor='var(--gold)'; this.style.color='#fff'" onmouseout="this.style.borderColor='#444'; this.style.color='#888'">
                            КОПИРОВАТЬ
                        </button>
                    </div>
                    
                    <!-- SOL -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        <div style="color: #fff; font-size: 0.95rem; word-break: break-all;">
                            🔗 <span style="color: var(--gold); font-weight: 700;">USDT (SOL):</span> H5mCXSxckDvrf655p4BfYZ2KpvfLACbnr8866dfJLLbi
                        </div>
                        <button onclick="copyToClipboard('H5mCXSxckDvrf655p4BfYZ2KpvfLACbnr8866dfJLLbi')" style="background: #222; border: 1px solid #444; color: #888; padding: 5px 15px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: 0.3s;" onmouseover="this.style.borderColor='var(--gold)'; this.style.color='#fff'" onmouseout="this.style.borderColor='#444'; this.style.color='#888'">
                            КОПИРОВАТЬ
                        </button>
                    </div>

                    <!-- ERC20 -->
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div style="color: #fff; font-size: 0.95rem; word-break: break-all;">
                            🔗 <span style="color: var(--gold); font-weight: 700;">USDT (ERC20):</span> 0xFE9C87D538E4b0a269ac9b33B466A0D92D7e1B5b
                        </div>
                        <button onclick="copyToClipboard('0xFE9C87D538E4b0a269ac9b33B466A0D92D7e1B5b')" style="background: #222; border: 1px solid #444; color: #888; padding: 5px 15px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: 0.3s;" onmouseover="this.style.borderColor='var(--gold)'; this.style.color='#fff'" onmouseout="this.style.borderColor='#444'; this.style.color='#888'">
                            КОПИРОВАТЬ
                        </button>
                    </div>

                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.8rem; padding-top: 20px; border-top: 1px solid #222;">
                © 2025 Gold Options Pro v2. Все права защищены.<br>
                Система полностью защищена и соответствует новым правилам безопасности Firebase.
            </div>

            <!-- КНОПКА ЗАКРЫТЬ -->
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="document.body.removeChild(document.getElementById('about-modal'))" 
                        class="auth-button" 
                        style="min-width: 200px; font-weight: 800; font-size: 1.1rem; box-shadow: 0 10px 30px rgba(255, 215, 0, 0.2);">
                    ЗАКРЫТЬ
                </button>
            </div>
        </div>
    `;
    
    // Закрытие по клику на фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
}

/**
 * Показ модального окна условий использования (ОБНОВЛЕННАЯ ВЕРСИЯ)
 */
function showTermsModal() {
    const modal = document.createElement('div');
    modal.id = 'terms-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(15px);
        display: flex; justify-content: center; align-items: center; z-index: 10001;
        overflow-y: auto; padding: 20px;
    `;
    
    modal.innerHTML = `
        <div class="auth-container" style="max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid var(--gold); box-shadow: 0 0 50px rgba(255, 215, 0, 0.1); padding: 40px; background: #050505;">
            
            <div class="auth-header" style="margin-bottom: 30px;">
                <div class="auth-logo" style="font-size: 2rem; color: var(--gold);">📜 УСЛОВИЯ ИСПОЛЬЗОВАНИЯ</div>
                <div class="auth-subtitle">Пользовательское соглашение и отказ от ответственности</div>
            </div>

            <div style="text-align: left; color: #ccc; line-height: 1.6; font-size: 0.95rem;">
                
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #fff; margin-bottom: 10px;">1. ОБЩИЕ ПОЛОЖЕНИЯ</h3>
                    <p>Используя программное обеспечение <strong>Gold Options Pro v2</strong> (далее — «Терминал»), вы подтверждаете свое полное согласие с данными условиями. Если вы не согласны с каким-либо пунктом, пожалуйста, немедленно прекратите использование Терминала.</p>
                </div>

                <div style="margin-bottom: 25px; padding: 20px; background: rgba(255, 23, 68, 0.1); border: 1px solid var(--put); border-radius: 8px;">
                    <h3 style="color: var(--put); margin-bottom: 10px;">⚠️ 2. ОТКАЗ ОТ ОТВЕТСТВЕННОСТИ (DISCLAIMER)</h3>
                    <p>
                        Вся информация, предоставляемая Терминалом (графики, уровни Max Pain, данные CME, сигналы MT5), носит исключительно <strong>информационный и ознакомительный характер</strong>.
                    </p>
                    <ul style="margin-top: 10px; padding-left: 20px;">
                        <li>Данные не являются финансовым советом, рекомендацией к покупке или продаже активов.</li>
                        <li>Администрация не несет ответственности за любые финансовые убытки, понесенные в результате использования данных Терминала.</li>
                        <li>Торговля на финансовых рынках (Форекс, Опционы, Фьючерсы) сопряжена с высоким риском потери капитала.</li>
                    </ul>
                </div>

                <div style="margin-bottom: 25px;">
                    <h3 style="color: #fff; margin-bottom: 10px;">3. ПРЕДОСТАВЛЕНИЕ ДАННЫХ</h3>
                    <p>Терминал агрегирует данные из открытых и закрытых источников (CME Group). Несмотря на то, что мы стремимся обеспечить максимальную точность и скорость обновления (каждые 3 секунды), возможны технические задержки или неточности, вызванные сбоями на стороне биржи или провайдеров данных.</p>
                </div>

                <div style="margin-bottom: 25px;">
                    <h3 style="color: #fff; margin-bottom: 10px;">4. ПОДПИСКА И ДОСТУП</h3>
                    <p>
                        Доступ к функциям PREMIUM (расширенная аналитика, MT5 коннектор, полная таблица страйков) предоставляется на платной основе. Администрация оставляет за собой право изменять тарифы или ограничивать доступ в случае выявления подозрительной активности (попытки взлома, передача аккаунта третьим лицам).
                    </p>
                </div>

                <div style="margin-bottom: 0;">
                    <h3 style="color: #fff; margin-bottom: 10px;">5. ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ</h3>
                    <p>Код, дизайн, алгоритмы расчета греков и аналитики являются интеллектуальной собственностью разработчиков Gold Options Pro v2. Копирование, перепродажа или реверс-инжиниринг запрещены.</p>
                </div>

            </div>

            <div style="text-align: center; margin-top: 40px; border-top: 1px solid #222; padding-top: 20px;">
                <button onclick="document.body.removeChild(document.getElementById('terms-modal'))" 
                        class="auth-button"
                        style="min-width: 200px; font-weight: 800; font-size: 1.1rem; box-shadow: 0 10px 30px rgba(255, 215, 0, 0.2);">
                    Я ПРИНИМАЮ УСЛОВИЯ И ЗАКРЫТЬ
                </button>
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
