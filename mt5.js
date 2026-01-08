// ============================================
// 🤖 MT5 МОДУЛЬ
// ============================================

const MT5Module = {
    connected: false,
    endpoint: Constants.MT5_CONFIG.endpoint,
    mode: 'manual',
    signals: [],
    
    /**
     * Инициализация MT5 модуля
     */
    init() {
        console.log('🤖 Инициализация MT5 модуля...');
        
        // Проверяем, является ли пользователь PREMIUM
        const isPremium = window.AuthModule?.currentUser?.plan === "PREMIUM" && 
                         !window.AuthModule?.isSubscriptionExpired(window.AuthModule.currentUser);
        
        if (!isPremium) {
            console.log('🔒 MT5 функции доступны только для PREMIUM пользователей');
            this.disableMT5Controls();
            return;
        }
        
        this.enableMT5Controls();
        console.log('✅ MT5 модуль инициализирован');
    },
    
    /**
     * Отключение элементов управления MT5
     */
    disableMT5Controls() {
        const mt5Elements = [
            '#mt5-endpoint',
            '#mt5-risk',
            '#mt5-size',
            '#mt5-tp',
            '#mt5-sl'
        ];
        
        mt5Elements.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                el.disabled = true;
                el.style.opacity = '0.5';
                el.style.cursor = 'not-allowed';
            }
        });
        
        const mt5Buttons = [
            '#btn-mt5-manual',
            '#btn-mt5-auto',
            '#btn-mt5-backtest'
        ];
        
        mt5Buttons.forEach(selector => {
            const btn = document.querySelector(selector);
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        });
        
        document.querySelectorAll('.btn[onclick*="sendMT5Signal"]').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
        
        document.querySelectorAll('.btn[onclick*="generateMT5Signals"]').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
        
        document.querySelectorAll('.btn[onclick*="sendMT5Top10"]').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
        
        document.querySelectorAll('.btn[onclick*="setSignalFilter"]').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
        
        document.querySelectorAll('.btn[onclick*="testMT5Connection"]').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
    },
    
    /**
     * Включение элементов управления MT5
     */
    enableMT5Controls() {
        const mt5Elements = [
            '#mt5-endpoint',
            '#mt5-risk',
            '#mt5-size',
            '#mt5-tp',
            '#mt5-sl'
        ];
        
        mt5Elements.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                el.disabled = false;
                el.style.opacity = '1';
                el.style.cursor = 'text';
            }
        });
        
        const mt5Buttons = [
            '#btn-mt5-manual',
            '#btn-mt5-auto',
            '#btn-mt5-backtest'
        ];
        
        mt5Buttons.forEach(selector => {
            const btn = document.querySelector(selector);
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        });
        
        document.querySelectorAll('.btn[onclick*="sendMT5Signal"]').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
        
        document.querySelectorAll('.btn[onclick*="generateMT5Signals"]').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
        
        document.querySelectorAll('.btn[onclick*="sendMT5Top10"]').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
        
        document.querySelectorAll('.btn[onclick*="setSignalFilter"]').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
        
        document.querySelectorAll('.btn[onclick*="testMT5Connection"]').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
    },
    
    /**
     * Проверка соединения с MT5
     */
    async testConnection() {
        const endpoint = document.getElementById('mt5-endpoint')?.value || this.endpoint;
        this.endpoint = endpoint;
        
        const statusEl = document.getElementById('mt5-status');
        if (statusEl) {
            statusEl.innerHTML = '<span style="color:#FFD700">TESTING...</span>';
        }
        
        try {
            const response = await axios.get(`${endpoint}/ping`, { timeout: 5000 });
            
            if (response.data && response.data.status === 'ok') {
                this.connected = true;
                if (statusEl) {
                    statusEl.innerHTML = '<span style="color:#00E676">CONNECTED</span>';
                }
                this.showNotification('MT5 connection successful!', 'success');
                return true;
            } else {
                this.connected = false;
                if (statusEl) {
                    statusEl.innerHTML = '<span style="color:#ff4444">INVALID RESPONSE</span>';
                }
                return false;
            }
        } catch (error) {
            this.connected = false;
            if (statusEl) {
                statusEl.innerHTML = '<span style="color:#ff4444">CONNECTION FAILED</span>';
            }
            this.showNotification('MT5 connection failed: ' + error.message, 'error');
            return false;
        }
    },
    
    /**
     * Установка режима MT5
     */
    setMode(mode) {
        this.mode = mode;
        
        document.querySelectorAll('#btn-mt5-manual, #btn-mt5-auto, #btn-mt5-backtest').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const modeBtn = document.getElementById(`btn-mt5-${mode}`);
        if (modeBtn) {
            modeBtn.classList.add('active');
        }
        
        this.showNotification(`MT5 mode changed to: ${mode.toUpperCase()}`, 'info');
    },
    
    /**
     * Отправка сигнала в MT5
     */
    async sendSignal(signal) {
        if (!this.connected) {
            this.showNotification('MT5 is not connected!', 'error');
            return;
        }
        
        const signalData = {
            signal: signal,
            symbol: 'XAUUSD',
            price: window.app?.currentPrice || 2600,
            timestamp: new Date().toISOString(),
            risk: parseFloat(document.getElementById('mt5-risk')?.value || Constants.MT5_CONFIG.defaultRisk),
            size: parseFloat(document.getElementById('mt5-size')?.value || Constants.MT5_CONFIG.defaultSize),
            tp: parseFloat(document.getElementById('mt5-tp')?.value || Constants.MT5_CONFIG.defaultTP),
            sl: parseFloat(document.getElementById('mt5-sl')?.value || Constants.MT5_CONFIG.defaultSL)
        };
        
        const statusEl = document.getElementById('mt5-status');
        if (statusEl) {
            statusEl.innerHTML = '<span style="color:#FFD700">SENDING SIGNAL...</span>';
        }
        
        try {
            const response = await axios.post(`${this.endpoint}/signal`, signalData);
            
            if (response.data && response.data.success) {
                if (statusEl) {
                    statusEl.innerHTML = '<span style="color:#00E676">CONNECTED</span>';
                }
                this.showNotification(`${signal} signal sent to MT5 successfully!`, 'success');
                this.addSignalToHistory({
                    time: new Date().toLocaleTimeString(),
                    signal: signal,
                    price: signalData.price.toFixed(2),
                    status: 'SENT'
                });
                return true;
            } else {
                if (statusEl) {
                    statusEl.innerHTML = '<span style="color:#ff4444">CONNECTED</span>';
                }
                this.showNotification('Failed to send signal', 'error');
                return false;
            }
        } catch (error) {
            if (statusEl) {
                statusEl.innerHTML = '<span style="color:#ff4444">CONNECTED</span>';
            }
            this.showNotification(`Failed to send signal: ${error.message}`, 'error');
            return false;
        }
    },
    
    /**
     * Добавление сигнала в историю
     */
    addSignalToHistory(signal) {
        const container = document.getElementById('mt5-signals');
        if (!container) return;
        
        const signalDiv = document.createElement('div');
        signalDiv.innerHTML = `
            <div style="background:rgba(30,30,30,0.6); margin:5px 0; padding:10px 15px; border-radius:6px; border-left:3px solid ${signal.signal === 'BUY' ? 'var(--call)' : signal.signal === 'SELL' ? 'var(--put)' : '#666'};">
                <div style="display:flex; justify-content:space-between; font-size:0.85em;">
                    <span style="color:#ccc;">${signal.time} - <strong style="color:${signal.signal === 'BUY' ? 'var(--call)' : signal.signal === 'SELL' ? 'var(--put)' : '#ccc'};">${signal.signal}</strong> @ $${signal.price}</span>
                    <span style="color:${signal.status === 'SENT' ? 'var(--call)' : '#ff4444'};">${signal.status}</span>
                </div>
            </div>
        `;
        
        container.insertBefore(signalDiv, container.firstChild);
        while (container.children.length > 20) {
            container.removeChild(container.lastChild);
        }
    },
    
    /**
     * Установка фильтра сигналов
     */
    setSignalFilter(filter) {
        document.querySelectorAll('.bottom-control-section button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const buttons = document.querySelectorAll('[onclick*="setSignalFilter"]');
        buttons.forEach(btn => {
            if (btn.textContent.includes(filter.toUpperCase())) {
                btn.classList.add('active');
            }
        });
        
        this.showNotification(`Signal filter: ${filter.toUpperCase()}`, 'info');
    },
    
    /**
     * Показ уведомления
     */
    showNotification(message, type = 'info') {
        if (window.app && typeof app.showNotification === 'function') {
            app.showNotification(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MT5Module;
} else {
    window.MT5Module = MT5Module;
}
