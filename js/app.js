// ============================================
// 🚀 ОСНОВНОЕ ПРИЛОЖЕНИЕ
// ============================================
const App = {
    initialized: false,
    currentPrice: 2600,
    priceSet: false,
    dteList: [],
    currentDTEIndex: 0,
    displayCount: Constants.APP_SETTINGS.defaultStrikeCount,
    showPremiums: false,
    forwardAdj: 0,
    isTrial: true,
    lastPrice: 0,
    priceInterval: null,
    analyticsInterval: null,
    dataInterval: null,
    
    /**
     * Инициализация приложения - ИСПРАВЛЕНО
     */
    async init() {
        console.log('🚀 [APP] Запуск приложения...');
        
        // ✅ ПРОВЕРКА АВТОРИЗАЦИИ
        if (!window.AuthModule || !window.AuthModule.currentUser) {
            console.warn('⚠️ [APP] Пользователь не авторизован, ожидание...');
            // Ждем авторизации
            setTimeout(() => {
                if (window.AuthModule && window.AuthModule.currentUser) {
                    this.init();
                } else {
                    console.error('❌ [APP] Пользователь не авторизован');
                }
            }, 1000);
            return;
        }
        
        console.log(`✅ [APP] Пользователь авторизован: ${window.AuthModule.currentUser.email}`);
        
        // ✅ ПРОВЕРКА FIREBASE КОНФИГА
        if (!window.firebaseConfig || !window.firebaseConfig.apiKey) {
            console.error('❌ [APP] Firebase конфигурация не загружена!');
            window.showErrorScreen('Firebase конфигурация не найдена. Обновите страницу.');
            return;
        }
        
        console.log('✅ [APP] Firebase конфиг найден:', window.firebaseConfig.projectId);
        
        if (this.initialized) {
            console.warn('⚠️ [APP] Приложение уже инициализировано');
            return;
        }
        
        try {
            console.log('🔧 [APP] Определяем тип пользователя...');
            
            // Определяем тип пользователя
            this.isTrial = window.AuthModule.currentUser.plan !== "PREMIUM" || 
                          window.AuthModule.isSubscriptionExpired(window.AuthModule.currentUser);
            
            console.log(`${this.isTrial ? '🔒' : '🔓'} [APP] Пользователь: ${this.isTrial ? 'TRIAL' : 'PREMIUM'}`);
            
            // Обновляем UI в зависимости от типа пользователя
            this.updateUIForUserType();
            
            console.log('📊 [APP] Загружаем начальные данные...');
            
            // Запускаем обновления данных
            this.startPriceUpdates();
            this.startDataUpdates();
            this.startAnalyticsUpdates();
            
            // Загружаем начальные данные
            await this.loadInitialData();
            console.log('✅ [APP] Начальные данные загружены');
            
            await this.loadDTEList();
            console.log('✅ [APP] Список DTE загружен');
            
            // Обновляем время
            this.updateTime();
            setInterval(() => this.updateTime(), 1000);
            
            // Инициализируем MT5 модуль (если существует)
            if (window.MT5Module) {
                console.log('🤖 [APP] Инициализируем MT5Module...');
                window.MT5Module.init();
            }
            
            this.initialized = true;
            console.log('✅ [APP] Приложение полностью инициализировано');
            
        } catch (error) {
            console.error('❌ [APP] Ошибка инициализации приложения:', error);
            window.showErrorScreen(`Ошибка инициализации: ${error.message}`);
        }
    },
    
    /**
     * Обновление UI для типа пользователя
     */
    updateUIForUserType() {
        try {
            if (this.isTrial) {
                console.log('🔒 [UI] Применяем TRIAL ограничения...');
                this.applyTrialRestrictions();
            } else {
                console.log('🔓 [UI] Разблокируем PREMIUM функции...');
                this.removePremiumBlocks();
            }
        } catch (error) {
            console.error('❌ [UI] Ошибка обновления UI:', error);
        }
    },
    
    /**
     * Применение ограничений TRIAL
     */
    applyTrialRestrictions() {
        try {
            // Блокируем все кнопки страйков кроме 15
            document.querySelectorAll('button[data-cnt]').forEach(btn => {
                const cnt = parseInt(btn.dataset.cnt);
                if (cnt !== 15) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.title = 'Доступно только в PREMIUM';
                }
            });
            
            // Блокируем Forward Adjustment
            const forwardAdjInput = document.getElementById('forward-adj');
            if (forwardAdjInput) {
                forwardAdjInput.disabled = true;
                forwardAdjInput.placeholder = "Premium only";
                forwardAdjInput.style.opacity = '0.5';
                forwardAdjInput.style.cursor = 'not-allowed';
            }
            
            // Показываем уведомление о TRIAL
            this.showTrialNotification();
            
            console.log('✅ [TRIAL] Ограничения применены');
        } catch (error) {
            console.error('❌ [TRIAL] Ошибка применения ограничений:', error);
        }
    },
    
    /**
     * Разблокировка PREMIUM функций
     */
    removePremiumBlocks() {
        try {
            document.querySelectorAll('.premium-block').forEach(el => {
                el.classList.remove('premium-block');
                const lock = el.querySelector('.premium-lock');
                if (lock) lock.remove();
                el.style.filter = 'none';
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
                el.style.userSelect = 'auto';
            });
            
            // Разблокируем все кнопки страйков
            document.querySelectorAll('button[data-cnt]').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.title = '';
            });
            
            // Разблокируем Forward Adjustment
            const forwardAdjInput = document.getElementById('forward-adj');
            if (forwardAdjInput) {
                forwardAdjInput.disabled = false;
                forwardAdjInput.placeholder = "0";
                forwardAdjInput.style.opacity = '1';
                forwardAdjInput.style.cursor = 'text';
            }
            
            // Убираем уведомление о TRIAL
            const trialNotification = document.querySelector('.trial-notification');
            if (trialNotification) trialNotification.remove();
            
            console.log('✅ [PREMIUM] Функции разблокированы');
        } catch (error) {
            console.error('❌ [PREMIUM] Ошибка разблокировки:', error);
        }
    },
    
    /**
     * Показ уведомления о TRIAL
     */
    showTrialNotification() {
        try {
            const daysLeft = window.AuthModule ? window.AuthModule.getDaysLeft() : 3;
            if (daysLeft <= 0) return;
            
            const existing = document.querySelector('.trial-notification');
            if (existing) existing.remove();
            
            const notification = document.createElement('div');
            notification.className = 'trial-notification';
            notification.innerHTML = `
                <button class="trial-notification-close" onclick="this.parentElement.remove()">×</button>
                <div class="trial-notification-title">⚡ TRIAL РЕЖИМ</div>
                <div class="trial-notification-text">
                    Базовые функции доступны. <strong>${daysLeft} дней</strong> осталось до окончания.
                </div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentElement) notification.remove();
            }, 10000);
            
            console.log('✅ [TRIAL] Уведомление показано');
        } catch (error) {
            console.error('❌ [TRIAL] Ошибка показа уведомления:', error);
        }
    },
    
    /**
     * Запуск обновления цены (каждые 3 секунды)
     */
    startPriceUpdates() {
        console.log('💰 [PRICE] Запуск обновления цены...');
        
        this.updatePrice();
        
        this.priceInterval = setInterval(() => {
            this.updatePrice();
        }, 3000);
    },

    /**
     * Запуск обновления аналитики (каждые 3 минуты)
     */
    startAnalyticsUpdates() {
        console.log('📈 [ANALYTICS] Запуск обновления аналитики...');
        
        this.updateAnalytics();
        
        this.analyticsInterval = setInterval(() => {
            this.updateAnalytics();
        }, 3 * 60 * 1000);
    },

    /**
     * Запуск обновления данных опционов (каждые 3 минуты)
     */
    startDataUpdates() {
        console.log('📊 [DATA] Запуск обновления данных...');
        
        this.updateData();
        
        this.dataInterval = setInterval(() => {
            this.updateData();
        }, 3 * 60 * 1000);
    },
    
    /**
     * Обновление цены
     */
    async updatePrice() {
        try {
            const price = await ApiService.getPrice();
            
            if (price && !isNaN(price) && price > 0) {
                this.currentPrice = price;
                this.priceSet = true;
                this.updatePriceUI(price);
                
                this.updateTime();
                
                const connStatus = document.getElementById('connStatus');
                if (connStatus) {
                    connStatus.innerHTML = '<span style="color:#00E676">🟢 LIVE CONNECTION</span>';
                }
                
                if (Math.abs(this.lastPrice - price) > 0.1) {
                    this.reloadCurrentDTE();
                    this.lastPrice = price;
                }
            }
        } catch (error) {
            console.error('❌ [PRICE] Ошибка обновления цены:', error);
            
            const connStatus = document.getElementById('connStatus');
            if (connStatus) {
                connStatus.innerHTML = '<span style="color:#ff4444">🔴 OFFLINE</span>';
            }
        }
    },

    /**
     * Обновление данных опционной цепи
     */
    async updateData() {
        if (this.dteList.length === 0) {
            console.log('⚠️ [DATA] Список DTE пуст');
            return;
        }
        
        const currentDTE = this.dteList[this.currentDTEIndex];
        
        try {
            const cacheKey = Constants.CACHE_VERSION + ':' + currentDTE.key;
            CacheService.delete(cacheKey);
            
            const records = await ApiService.getDTEData(currentDTE.key);
            
            if (records.length > 0) {
                CacheService.set(cacheKey, records, 2 * 60 * 1000);
                
                this.renderTable(records);
                
                if (window.ChartsModule) {
                    window.ChartsModule.createAllCharts(records);
                }
                
                this.updateTopStats(records);
                
                console.log(`✅ [DATA] Данные обновлены для ${currentDTE.key}`);
            }
        } catch (error) {
            console.error(`❌ [DATA] Ошибка обновления для ${currentDTE.key}:`, error);
        }
    },
    
    /**
     * Обновление аналитики
     */
    async updateAnalytics() {
        if (this.dteList.length === 0) return;
        
        const currentDTE = this.dteList[this.currentDTEIndex];
        
        try {
            const analyticsData = await ApiService.getAnalytics(currentDTE.idx);
            
            if (analyticsData) {
                this.updateAnalyticsUI(analyticsData);
            }
        } catch (error) {
            console.error('❌ [ANALYTICS] Ошибка обновления аналитики:', error);
        }
    },
    
    /**
     * Загрузка начальных данных
     */
    async loadInitialData() {
        try {
            console.log('📥 [INIT] Загружаем начальные данные...');
            
            const price = await ApiService.getPrice();
            if (price && !isNaN(price) && price > 0) {
                this.currentPrice = price;
                this.priceSet = true;
                this.updatePriceUI(price);
            }
        } catch (error) {
            console.error('❌ [INIT] Ошибка загрузки начальных данных:', error);
        }
    },
    
    /**
     * Загрузка списка DTE
     */
    async loadDTEList() {
        console.log('📅 [DTE] Загружаем список DTE...');
        
        const container = document.getElementById('dte-buttons');
        if (container) {
            container.innerHTML = '<span style="color:#666">Loading expirations...</span>';
        }
        
        this.dteList = [];
        const maxDTE = 9;
        const promises = [];
        
        for (let dte = 0; dte <= maxDTE; dte++) {
            promises.push(ApiService.checkDTEExists(dte));
        }
        
        try {
            const results = await Promise.all(promises);
            this.dteList = results.filter(item => item !== null);
            this.dteList.sort((a, b) => a.idx - b.idx);
            
            if (this.dteList.length > 0) {
                console.log(`✅ [DTE] Найдено ${this.dteList.length} DTE`);
                this.renderDTEButtons();
                await this.loadData(0);
                
                const dteDisplay = document.getElementById('current-dte-display');
                if (dteDisplay) {
                    dteDisplay.innerText = this.dteList[0].idx;
                }
            } else {
                console.warn('⚠️ [DTE] Данные DTE не найдены');
                if (container) {
                    container.innerHTML = '<span style="color:#ff4444">No expiration data found</span>';
                }
            }
        } catch (error) {
            console.error('❌ [DTE] Ошибка загрузки списка DTE:', error);
        }
    },
    
    /**
     * Рендеринг кнопок DTE
     */
    renderDTEButtons() {
        try {
            const container = document.getElementById('dte-buttons');
            if (!container) return;
            
            container.innerHTML = '';
            
            this.dteList.forEach((item, index) => {
                const btn = document.createElement('button');
                btn.className = `btn ${index === 0 ? 'active' : ''}`;
                btn.innerText = item.display;
                btn.dataset.dte = item.idx;
                btn.dataset.key = item.key;
                btn.onclick = () => {
                    document.querySelectorAll('#dte-buttons .btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.loadData(index);
                    
                    const dteDisplay = document.getElementById('current-dte-display');
                    if (dteDisplay) {
                        dteDisplay.innerText = item.idx;
                    }
                };
                container.appendChild(btn);
            });
            
            console.log('✅ [UI] Кнопки DTE отрендерены');
        } catch (error) {
            console.error('❌ [UI] Ошибка рендеринга кнопок DTE:', error);
        }
    },

    // ДОБАВИТЬ ПОСЛЕ renderDTEButtons():
this.updateControlPanel();

// И добавить новый метод:
/**
 * Обновление контрольной панели (видимость Forward и Strikes)
 */
updateControlPanel() {
    try {
        const forwardInput = document.getElementById('forward-adj');
        const strikeCountInput = document.getElementById('strike-count');
        
        // Показываем эти элементы
        if (forwardInput) forwardInput.style.display = 'block';
        if (strikeCountInput) strikeCountInput.style.display = 'block';
        
        // Проверяем если TRIAL - отключаем Forward
        if (this.isTrial) {
            if (forwardInput) {
                forwardInput.disabled = true;
                forwardInput.style.opacity = '0.5';
                forwardInput.title = 'Available in PREMIUM';
            }
        }
        
        console.log('✅ [CONTROL] Панель управления обновлена');
    } catch (error) {
        console.error('❌ [CONTROL] Ошибка обновления панели:', error);
    }
}
    
    /**
     * Загрузка данных для DTE - ИСПРАВЛЕНО
     */
    async loadData(index) {
        if (index >= this.dteList.length) return;
        
        this.currentDTEIndex = index;
        const dteItem = this.dteList[index];
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📥 ЗАГРУЗКА ДАННЫХ ДЛЯ ${dteItem.key}`);
        console.log(`${'='.repeat(60)}`);
        
        try {
            const tableLabel = document.getElementById('table-dte-label');
            if (tableLabel) {
                tableLabel.innerText = `EXPIRATION: ${dteItem.display}`;
            }
            
            const cacheKey = Constants.CACHE_VERSION + ':' + dteItem.key;
            let records = CacheService.get(cacheKey);
            
            if (!records) {
                console.log(`\n🔄 [CACHE] Кэш пуст, загружаем с Firebase...`);
                console.log(`   Key: ${dteItem.key}`);
                console.log(`   Cache Key: ${cacheKey}`);
                
                records = await ApiService.getDTEData(dteItem.key);
                
                console.log(`\n📊 [RESULT] Получено записей: ${records ? records.length : 0}`);
                
                if (records && records.length > 0) {
                    console.log(`\n✅ [SAMPLE] Первая запись:`, records[0]);
                    console.log(`\n✅ [CACHE] Сохраняем в кэш...`);
                    
                    CacheService.set(cacheKey, records);
                } else {
                    console.error(`\n❌ [ERROR] Записи не получены!`);
                    this.showNotification('Ошибка загрузки данных из Firebase', 'error');
                    return;
                }
            } else {
                console.log(`✅ [CACHE] Используем кэш (${records.length} записей)`);
            }
            
            if (records.length > 0) {
                console.log(`\n🎨 [RENDER] Рендеринг интерфейса...`);
                
                this.renderTable(records);
                console.log(`   ✅ Таблица отрендерена`);
                
                if (window.ChartsModule) {
                    window.ChartsModule.createAllCharts(records);
                    console.log(`   ✅ Графики созданы`);
                }
                
                this.updateTopStats(records);
                console.log(`   ✅ Статистика обновлена`);
                
                // ИСПРАВЛЕНО: Вместо updateAnalyticsForDTE вызываем updateAnalytics
                this.updateAnalytics();
                console.log(`   ✅ Аналитика обновлена`);
                
                this.loadBreakevensForDTE(dteItem.idx);
                console.log(`   ✅ Безубытки загружены`);
                
                console.log(`\n✅ [SUCCESS] Все данные загружены и отрендерены!\n`);
            }
        } catch (error) {
            console.error(`\n❌ [FATAL ERROR] Ошибка загрузки для ${dteItem.key}:`, error);
            this.showNotification(`Ошибка: ${error.message}`, 'error');
        }
    },
    
    /**
     * Загрузка безубытков для DTE
     */
    async loadBreakevensForDTE(dte) {
        try {
            const breakevens = await ApiService.getBreakevens(dte);
            this.displayTopBreakevens(breakevens);
        } catch (error) {
            console.error('❌ [BREAKEVENS] Ошибка загрузки безубытков:', error);
        }
    },
    
    /**
     * Рендеринг таблицы - ИСПРАВЛЕНО
     */
    renderTable(records) {
        try {
            const tbody = document.getElementById('table-body');
            if (!tbody || !records || records.length === 0) {
                console.warn('⚠️ [TABLE] Таблица не найдена или нет записей');
                return;
            }
            
            console.log(`\n📋 [TABLE] Начало рендеринга ${records.length} записей`);
            
            let workingPrice = this.currentPrice;
            if (workingPrice <= 0) {
                const sorted = [...records].sort((a,b) => parseFloat(a.s) - parseFloat(b.s));
                if (sorted.length > 0) {
                    workingPrice = parseFloat(sorted[Math.floor(sorted.length/2)].s);
                } else {
                    workingPrice = 4520;
                }
            }
            
            console.log(`   💰 Working Price: $${workingPrice}`);
            
            const sorted = [...records].sort((a, b) => parseFloat(a.s) - parseFloat(b.s));
            
            // Находим ATM страйк
            let atmStrike = null;
            let minDiff = Infinity;
            
            sorted.forEach(r => {
                const diff = Math.abs(parseFloat(r.s) - workingPrice);
                if (diff < minDiff) {
                    minDiff = diff;
                    atmStrike = parseFloat(r.s);
                }
            });
            
            console.log(`   🎯 ATM Strike: $${atmStrike}`);
            
            const halfCount = Math.floor(this.displayCount / 2);
            const startIdx = Math.max(0, sorted.findIndex(r => parseFloat(r.s) === atmStrike) - halfCount);
            const endIdx = Math.min(sorted.length, startIdx + this.displayCount);
            const displayRecords = sorted.slice(startIdx, endIdx);
            
            console.log(`   📊 Отобразим записей: ${displayRecords.length} (с ${startIdx} по ${endIdx})`);
            
            let html = '';
            let rowCount = 0;
            
            displayRecords.forEach(r => {
                try {
                    const strike = parseFloat(r.s);
                    const isATM = strike === atmStrike;
                    
                    // ✅ ВАЖНО: Данные в формате {c: {...}, p: {...}, s: strike}
                    const call = (r.c && typeof r.c === 'object') ? r.c : {};
                    const put = (r.p && typeof r.p === 'object') ? r.p : {};
                    
                    // Достаем значения
                    const callOI = parseInt(call.oi) || 0;
                    const callVol = parseInt(call.v) || 0;
                    const callIV = parseFloat(call.iv) || 0;
                    const callDelta = parseFloat(call.d) || 0;
                    const callGamma = parseFloat(call.g) || 0;
                    const callTheta = parseFloat(call.t) || 0;
                    const callPrem = parseFloat(call.pr) || 0;
                    
                    const putOI = parseInt(put.oi) || 0;
                    const putVol = parseInt(put.v) || 0;
                    const putIV = parseFloat(put.iv) || 0;
                    const putDelta = parseFloat(put.d) || 0;
                    const putGamma = parseFloat(put.g) || 0;
                    const putTheta = parseFloat(put.t) || 0;
                    const putPrem = parseFloat(put.pr) || 0;
                    
                    // Цвета
                    const getColorForValue = (value) => {
                        if (value === 0 || value === undefined) return 'rgba(100, 100, 100, 0.3)';
                        if (value <= 50) return 'rgba(150, 150, 150, 0.4)';
                        if (value <= 100) return 'rgba(200, 200, 200, 0.3)';
                        if (value <= 150) return 'rgba(100, 150, 255, 0.3)';
                        if (value <= 250) return 'rgba(255, 230, 100, 0.3)';
                        if (value <= 400) return 'rgba(255, 215, 0, 0.4)';
                        if (value <= 700) return 'rgba(255, 100, 100, 0.4)';
                        return 'rgba(255, 0, 0, 0.5)';
                    };
                    
                    let displayedStrike = strike + this.forwardAdj;
                    const callStrike = this.showPremiums ? (displayedStrike + callPrem).toFixed(1) : displayedStrike.toFixed(1);
                    const putStrike = this.showPremiums ? (displayedStrike - putPrem).toFixed(1) : displayedStrike.toFixed(1);
                    const callPremDisplay = this.showPremiums ? callPrem.toFixed(2) : '---';
                    const putPremDisplay = this.showPremiums ? putPrem.toFixed(2) : '---';
                    
                    html += `
                        <tr class="${isATM ? 'row-atm' : ''}">
                            <td style="background: ${getColorForValue(callOI)}; font-weight: 600;">${callOI}</td>
                            <td style="background: ${getColorForValue(callVol)}; font-weight: 600;">${callVol}</td>
                            <td style="color: ${this.showPremiums ? 'var(--call)' : '#888'}; font-weight: ${this.showPremiums ? '700' : '400'}; background: ${this.showPremiums ? 'rgba(0, 230, 118, 0.1)' : 'transparent'};">
                                ${callPremDisplay}
                            </td>
                            <td>${callDelta ? callDelta.toFixed(4) : '-'}</td>
                            <td>${callGamma ? callGamma.toFixed(4) : '-'}</td>
                            <td>${callIV ? callIV.toFixed(2) : '-'}</td>
                            <td class="strike-cell">
                                <div style="text-align: center;">
                                    <div style="font-size: 0.75em; color: #888; margin-bottom: 3px;">STRIKE</div>
                                    <div style="font-weight: 800; color: var(--gold); font-size: 1.1em;">$${displayedStrike.toFixed(1)}</div>
                                </div>
                            </td>
                            <td>${putIV ? putIV.toFixed(2) : '-'}</td>
                            <td>${putGamma ? putGamma.toFixed(4) : '-'}</td>
                            <td>${putDelta ? putDelta.toFixed(4) : '-'}</td>
                            <td style="color: ${this.showPremiums ? 'var(--put)' : '#888'}; font-weight: ${this.showPremiums ? '700' : '400'}; background: ${this.showPremiums ? 'rgba(255, 23, 68, 0.1)' : 'transparent'};">
                                ${putPremDisplay}
                            </td>
                            <td style="background: ${getColorForValue(putVol)}; font-weight: 600;">${putVol}</td>
                            <td style="background: ${getColorForValue(putOI)}; font-weight: 600;">${putOI}</td>
                        </tr>
                    `;
                    rowCount++;
                } catch (rowError) {
                    console.error(`   ⚠️ Ошибка обработки строки ${rowCount}:`, rowError);
                }
            });
            
            tbody.innerHTML = html;
            console.log(`✅ [TABLE] Таблица отрендерена (${rowCount} строк)\n`);
            
        } catch (error) {
            console.error('❌ [TABLE] Ошибка рендеринга таблицы:', error);
        }
    },
    
    /**
 * ИСПРАВЛЕННОЕ обновление статистики с VOL
 */
updateTopStats(records) {
    try {
        if (!records || records.length === 0) return;
        
        const sorted = [...records].sort((a, b) => parseFloat(a.s) - parseFloat(b.s));
        
        // Маппируем в нужный формат
        const adjustedRecords = sorted.map(r => ({
            strike: parseFloat(r.s),
            adjusted_s: parseFloat(r.s) + this.forwardAdj,
            call_oi: (r.c && r.c.oi) ? parseInt(r.c.oi) : 0,
            call_vol: (r.c && r.c.v) ? parseInt(r.c.v) : 0,
            call_prem: (r.c && r.c.pr) ? parseFloat(r.c.pr) : 0,
            put_oi: (r.p && r.p.oi) ? parseInt(r.p.oi) : 0,
            put_vol: (r.p && r.p.v) ? parseInt(r.p.v) : 0,
            put_prem: (r.p && r.p.pr) ? parseFloat(r.p.pr) : 0
        }));
        
        // ✅ TOP CALL OI
        const topCallOI = adjustedRecords
            .map(r => ({ 
                strike: r.strike, 
                adjusted_strike: r.adjusted_s, 
                value: r.call_oi, 
                prem: r.call_prem 
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        
        // ✅ TOP PUT OI
        const topPutOI = adjustedRecords
            .map(r => ({ 
                strike: r.strike, 
                adjusted_strike: r.adjusted_s, 
                value: r.put_oi, 
                prem: r.put_prem 
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        
        // ✅ TOP CALL VOL (ИСПРАВЛЕНО - БЫЛ BUG)
        const topCallVol = adjustedRecords
            .map(r => ({ 
                strike: r.strike, 
                adjusted_strike: r.adjusted_s, 
                value: r.call_vol,  // ← БЫЛА call_oi, ТЕПЕРЬ call_vol!
                prem: r.call_prem 
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        
        // ✅ TOP PUT VOL (ИСПРАВЛЕНО - БЫЛ BUG)
        const topPutVol = adjustedRecords
            .map(r => ({ 
                strike: r.strike, 
                adjusted_strike: r.adjusted_s, 
                value: r.put_vol,  // ← БЫЛА put_oi, ТЕПЕРЬ put_vol!
                prem: r.put_prem 
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        
        // Обновляем UI
        this.updateTopStatList('top-call-oi', topCallOI);
        this.updateTopStatList('top-put-oi', topPutOI);
        this.updateTopStatList('top-call-vol', topCallVol);
        this.updateTopStatList('top-put-vol', topPutVol);
        
        console.log('✅ [STATS] Статистика обновлена');
    } catch (error) {
        console.error('❌ [STATS] Ошибка обновления статистики:', error);
    }
},
    
    /**
     * Обновление списка статистики
     */
    updateTopStatList(elementId, data) {
        try {
            const container = document.getElementById(elementId);
            if (!container) return;
            
            const isCall = elementId.includes('call');
            const textColor = isCall ? Constants.COLORS.call : Constants.COLORS.put;
            
            container.innerHTML = data.map(item => {
                let adjustedStrike = item.adjusted_strike;
                if (this.showPremiums) {
                    if (isCall) adjustedStrike = item.adjusted_strike + item.prem;
                    else adjustedStrike = item.adjusted_strike - item.prem;
                }
                
                return `
                    <div class="top-stat-item">
                        <span class="top-stat-strike" style="color: ${textColor};">$${adjustedStrike.toFixed(1)}</span>
                        <span class="top-stat-value" style="color: ${textColor};">${item.value.toLocaleString()}</span>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('❌ [STATS] Ошибка обновления списка статистики:', error);
        }
    },
    
    /**
     * Обновление UI цены
     */
    updatePriceUI(price) {
        try {
            const el = document.getElementById('price');
            if (!el) return;
            
            el.innerText = '$' + price.toFixed(2);
            el.classList.remove('pulse');
            void el.offsetWidth;
            el.classList.add('pulse');
        } catch (error) {
            console.error('❌ [PRICE] Ошибка обновления UI цены:', error);
        }
    },
    
    /**
     * Обновление UI аналитики - ИСПРАВЛЕННАЯ
     */
    updateAnalyticsUI(data) {
        try {
            if (!data) return;
            
            // Максимальная боль
            if (data.mp !== undefined) {
                const mpEl = document.getElementById('mp');
                if (mpEl) mpEl.innerText = '$' + parseFloat(data.mp).toFixed(1);
            }
            
            // Ожидаемое движение
            if (data.em !== undefined) {
                const em = parseFloat(data.em);
                const emEl = document.getElementById('em');
                if (emEl) emEl.innerText = '±$' + em.toFixed(1);
            }
            
            // Нулевая гамма
            if (data.zg !== undefined) {
                const zgEl = document.getElementById('zg');
                const zgValue = parseFloat(data.zg);
                if (zgEl) zgEl.innerText = '$' + zgValue.toFixed(1);
            }
            
            // Соотношение Call/Put
            if (data.cp_ratio !== undefined) {
                const cpRatioEl = document.getElementById('cp-ratio');
                if (cpRatioEl) cpRatioEl.innerText = parseFloat(data.cp_ratio).toFixed(2);
            }
        } catch (error) {
            console.error('❌ [ANALYTICS UI] Ошибка обновления UI аналитики:', error);
        }
    },
    
    /**
 * ИСПРАВЛЕННОЕ отображение TOP 10 BREAKEVENS (как на скрине 2)
 */
displayTopBreakevens(breakevens) {
    try {
        if (!breakevens || breakevens.length === 0) {
            console.warn('⚠️ [BREAKEVENS] Нет данных');
            return;
        }
        
        // Ищем контейнер для breakevens
        let breakevensContainer = document.getElementById('breakevens-grid');
        
        // Если контейнера нет - создаем его
        if (!breakevensContainer) {
            const section = document.createElement('div');
            section.style.cssText = `
                margin: 60px 0;
                padding: 0 40px;
                width: 100%;
            `;
            
            section.innerHTML = `
                <h2 class="section-header">🎯 TOP 10 BREAKEVENS (MT5 READY)</h2>
                <div id="breakevens-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 20px;
                    padding: 0;
                "></div>
            `;
            
            // Вставляем ПЕРЕД bottom-control-panel
            const controlPanel = document.querySelector('.bottom-control-panel');
            if (controlPanel) {
                controlPanel.parentElement.insertBefore(section, controlPanel);
            } else {
                document.querySelector('.container').appendChild(section);
            }
            
            breakevensContainer = document.getElementById('breakevens-grid');
        }
        
        // Берем ТОП 10 и сортируем (CALL первыми)
        const top10 = breakevens.slice(0, 10);
        const callBreaks = top10.filter(b => b.type === 'CALL').sort((a, b) => (b.oi || 0) - (a.oi || 0));
        const putBreaks = top10.filter(b => b.type === 'PUT').sort((a, b) => (b.oi || 0) - (a.oi || 0));
        const sorted = [...callBreaks, ...putBreaks].slice(0, 10);
        
        // HTML для каждого breakeven (как на скрине 2)
        breakevensContainer.innerHTML = sorted.map((b, idx) => {
            const isCall = b.type === 'CALL';
            const borderColor = isCall ? '#00E676' : '#FF1744';
            const bgColor = isCall ? 'rgba(0, 230, 118, 0.05)' : 'rgba(255, 23, 68, 0.05)';
            const distance = b.s ? ((Math.abs(parseFloat(b.be || 0) - parseFloat(b.s)) / parseFloat(b.s)) * 100).toFixed(2) : 0;
            const isVeryClose = distance < 1;
            
            return `
                <div style="
                    background: ${bgColor};
                    border: 2px solid ${borderColor};
                    border-radius: 15px;
                    padding: 20px;
                    position: relative;
                    overflow: hidden;
                ">
                    <!-- Номер и тип -->
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                    ">
                        <div style="
                            background: ${borderColor};
                            color: #000;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: 800;
                            font-size: 1.2rem;
                        ">
                            ${idx + 1}
                        </div>
                        <div style="
                            color: ${borderColor};
                            font-weight: 700;
                            font-size: 1rem;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        ">
                            ${b.type}
                        </div>
                    </div>
                    
                    <!-- Breakeven цена -->
                    <div style="
                        font-size: 2rem;
                        font-weight: 900;
                        color: var(--gold);
                        margin: 10px 0;
                        text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
                    ">
                        $${parseFloat(b.be || 0).toFixed(1)}
                    </div>
                    
                    <!-- Детали -->
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        margin: 15px 0;
                        padding: 12px 0;
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    ">
                        <div>
                            <div style="color: #888; font-size: 0.75rem; text-transform: uppercase;">Strike</div>
                            <div style="color: #fff; font-weight: 700;">$${parseFloat(b.s || 0).toFixed(1)}</div>
                        </div>
                        <div>
                            <div style="color: #888; font-size: 0.75rem; text-transform: uppercase;">Premium</div>
                            <div style="color: ${borderColor}; font-weight: 700;">$${parseFloat(b.pr || 0).toFixed(2)}</div>
                        </div>
                        <div>
                            <div style="color: #888; font-size: 0.75rem; text-transform: uppercase;">Vol</div>
                            <div style="color: #fff; font-weight: 700;">${parseInt(b.v || 0).toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: #888; font-size: 0.75rem; text-transform: uppercase;">OI</div>
                            <div style="color: #fff; font-weight: 700;">${parseInt(b.oi || 0).toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <!-- Distance -->
                    <div style="
                        padding: 10px 0;
                        font-size: 0.9rem;
                        font-weight: 600;
                        color: ${isVeryClose ? '#FFD700' : borderColor};
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">
                        Distance: ${distance}% ${isVeryClose ? '⬇️ VERY CLOSE!' : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ [BREAKEVENS] ТОП 10 отрендерены');
    } catch (error) {
        console.error('❌ [BREAKEVENS] Ошибка отображения:', error);
    }
},
    
    /**
     * Обновление времени
     */
    updateTime() {
        try {
            const now = new Date();
            const updatedEl = document.getElementById('updated');
            if (updatedEl) {
                updatedEl.innerText = now.toLocaleTimeString();
            }
        } catch (error) {
            console.error('❌ [TIME] Ошибка обновления времени:', error);
        }
    },
    
    /**
 * ИСПРАВЛЕННОЕ переключение отображения премий
 */
togglePremium() {
    try {
        // Переключаем флаг
        this.showPremiums = !this.showPremiums;
        
        console.log(`💳 [PREMIUM] Переключение: ${this.showPremiums ? 'ON' : 'OFF'}`);
        
        // ✅ Находим ВСЕ кнопки с id="btn-prem" и обновляем их
        const allPremButtons = document.querySelectorAll('#btn-prem');
        allPremButtons.forEach(btn => {
            btn.innerText = this.showPremiums ? 'ON' : 'OFF';
            btn.classList.toggle('active', this.showPremiums);
            
            // Визуальные стили
            if (this.showPremiums) {
                btn.style.background = 'var(--gradient-gold)';
                btn.style.color = '#000';
                btn.style.fontWeight = '800';
                btn.style.boxShadow = '0 0 15px var(--gold-glow)';
            } else {
                btn.style.background = 'rgba(40, 40, 40, 0.9)';
                btn.style.color = 'var(--text-muted)';
                btn.style.fontWeight = '600';
                btn.style.boxShadow = 'none';
            }
        });
        
        // ✅ Перерисовываем таблицу с новыми премиями
        this.reloadCurrentDTE();
        
        console.log('✅ [PREMIUM] Кнопки обновлены и таблица перерисована');
    } catch (error) {
        console.error('❌ [PREMIUM] Ошибка переключения:', error);
    }
},
    
    /**
     * Применение коррекции вперед
     */
    applyForwardAdjustment() {
        try {
            if (this.isTrial) {
                this.showNotification('Forward Adjustment доступен только в PREMIUM версии', 'warning');
                const input = document.getElementById('forward-adj');
                if (input) input.value = 0;
                return;
            }
            
            const input = document.getElementById('forward-adj');
            if (!input) return;
            
            const newValue = parseFloat(input.value) || 0;
            this.forwardAdj = newValue;
            
            this.reloadCurrentDTE();
            console.log('✅ [FORWARD] Коррекция применена:', newValue);
        } catch (error) {
            console.error('❌ [FORWARD] Ошибка применения коррекции:', error);
        }
    },
    
    /**
     * Изменение количества отображаемых страйков
     */
    changeStrikeCount() {
        try {
            const input = document.getElementById('strike-count');
            if (!input) return;
            
            const newCount = parseInt(input.value) || 15;
            if (newCount < 5 || newCount > 30) {
                this.showNotification('Количество страйков должно быть от 5 до 30', 'warning');
                return;
            }
            
            this.displayCount = newCount;
            this.reloadCurrentDTE();
            console.log(`✅ [TABLE] Количество страйков изменено: ${newCount}`);
        } catch (error) {
            console.error('❌ [TABLE] Ошибка изменения количества страйков:', error);
        }
    },
    
    /**
     * Перезагрузка текущего DTE
     */
    reloadCurrentDTE() {
        try {
            if (this.dteList.length === 0) return;
            
            const dteItem = this.dteList[this.currentDTEIndex];
            const cacheKey = Constants.CACHE_VERSION + ':' + dteItem.key;
            
            CacheService.delete(cacheKey);
            this.loadData(this.currentDTEIndex);
        } catch (error) {
            console.error('❌ [RELOAD] Ошибка перезагрузки DTE:', error);
        }
    },
    
    /**
     * Показ уведомления
     */
    showNotification(message, type = 'info') {
        try {
            const colors = { 
                success: '#00E676', 
                error: '#FF1744', 
                warning: '#FFD700', 
                info: '#2196F3' 
            };
            
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 100px; right: 20px;
                background: rgba(20, 20, 20, 0.95); color: white;
                padding: 15px 20px; border-radius: 8px;
                border-left: 4px solid ${colors[type]};
                box-shadow: 0 5px 20px rgba(0,0,0,0.5); z-index: 10000;
                max-width: 400px; font-weight: 600;
            `;
            
            notification.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:8px; height:8px; border-radius:50%; background:${colors[type]};"></div>
                    <div>${message}</div>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentElement) {
                    document.body.removeChild(notification);
                }
            }, 3000);
        } catch (error) {
            console.error('❌ [NOTIFICATION] Ошибка показа уведомления:', error);
        }
    },
    
    /**
     * Очистка приложения
     */
    cleanup() {
        console.log('🧹 [CLEANUP] Очистка приложения...');
        
        try {
            if (this.priceInterval) clearInterval(this.priceInterval);
            if (this.analyticsInterval) clearInterval(this.analyticsInterval);
            if (this.dataInterval) clearInterval(this.dataInterval);
            
            if (window.ChartsModule) {
                window.ChartsModule.destroyAllCharts();
            }
            
            if (window.CacheService) {
                window.CacheService.clear();
            }
            
            this.initialized = false;
            console.log('✅ [CLEANUP] Приложение очищено');
        } catch (error) {
            console.error('❌ [CLEANUP] Ошибка при очистке:', error);
        }
    }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
} else {
    window.app = App;
}
console.log('✅ App модуль загружен');
