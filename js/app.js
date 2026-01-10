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
     * Инициализация приложения
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
            await this.loadDTEList();
            
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
    
    // ... остальной код остается без изменений ...
    

    
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
    
    /**
 * Загрузка данных для DTE - С ДЕБАГ ЛОГАМИ
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
            
            this.updateAnalyticsForDTE(dteItem.idx);
            this.loadBreakevensForDTE(dteItem.idx);
            
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
 * Обновление статистики - ИСПРАВЛЕНО
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
        
        const topCallOI = adjustedRecords
            .map(r => ({ 
                strike: r.strike, 
                adjusted_strike: r.adjusted_s, 
                value: r.call_oi, 
                prem: r.call_prem 
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        
        const topPutOI = adjustedRecords
            .map(r => ({ 
                strike: r.strike, 
                adjusted_strike: r.adjusted_s, 
                value: r.put_oi, 
                prem: r.put_prem 
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        
        const topCallVol = adjustedRecords
            .map(r => ({ 
                strike: r.strike, 
                adjusted_strike: r.adjusted_s, 
                value: r.call_vol, 
                prem: r.call_prem 
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        
        const topPutVol = adjustedRecords
            .map(r => ({ 
                strike: r.strike, 
                adjusted_strike: r.adjusted_s, 
                value: r.put_vol, 
                prem: r.put_prem 
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        
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
     * Обновление UI аналитики
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
                const emRangeEl = document.getElementById('em-range');
                
                if (emEl) emEl.innerText = '±$' + em.toFixed(1);
                if (emRangeEl && this.currentPrice > 0) {
                    const up = (this.currentPrice + em).toFixed(0);
                    const down = (this.currentPrice - em).toFixed(0);
                    emRangeEl.innerText = `Range: $${down} - $${up}`;
                }
            }
            
            // Нулевая гамма
            if (data.zg !== undefined) {
                const zgEl = document.getElementById('zg');
                const zgPosEl = document.getElementById('zg-pos');
                const zgValue = parseFloat(data.zg);
            if (zgEl) zgEl.innerText = '$' + zgValue.toFixed(1);
            if (zgPosEl && this.currentPrice > 0) {
                const diff = this.currentPrice - zgValue;
                if (Math.abs(diff) < 50) zgPosEl.innerHTML = '<span style="color:var(--gold)">🎯 ОЧЕНЬ БЛИЗКО</span>';
                else if (diff > 0) zgPosEl.innerHTML = `<span style="color:var(--call)">↑ +${Math.abs(diff).toFixed(1)}</span>`;
                else zgPosEl.innerHTML = `<span style="color:var(--put)">↓ ${diff.toFixed(1)}</span>`;
            }
        }
        
        // Соотношение Call/Put
        if (data.cp_ratio !== undefined) {
            const cpRatioEl = document.getElementById('cp-ratio');
            if (cpRatioEl) cpRatioEl.innerText = parseFloat(data.cp_ratio).toFixed(2);
            
            const sentimentEl = document.getElementById('sentiment');
            if (sentimentEl) {
                const ratio = parseFloat(data.cp_ratio);
                if (ratio > 1.2) sentimentEl.innerHTML = '<span style="color:var(--call)">BEARISH 📉</span>';
                else if (ratio < 0.8) sentimentEl.innerHTML = '<span style="color:var(--put)">BULLISH 📈</span>';
                else sentimentEl.innerHTML = '<span style="color:#aaa">NEUTRAL ➡️</span>';
            }
        }
    } catch (error) {
        console.error('❌ [ANALYTICS UI] Ошибка обновления UI аналитики:', error);
    }
},

/**
 * Отображение TOP безубытков
 */
displayTopBreakevens(breakevens) {
    try {
        const container = document.getElementById('top-breakevens');
        if (!container) return;
        
        if (!breakevens || breakevens.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#888; padding:30px;">No breakeven data</div>';
            return;
        }
        
        const displayBreakevens = breakevens.slice(0, 10);
        
        container.innerHTML = displayBreakevens.map((b, index) => `
            <div style="background:${b.type === 'CALL' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 23, 68, 0.1)'}; border:2px solid ${b.type === 'CALL' ? 'var(--call)' : 'var(--put)'}; border-radius:10px; padding:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="font-weight:800; color:${b.type === 'CALL' ? 'var(--call)' : 'var(--put)'};">#${index + 1} ${b.type}</div>
                    <div style="font-weight:700; color:var(--gold);">$${b.be?.toFixed(1) || '0'}</div>
                </div>
            </div>
        `).join('');
        
        console.log('✅ [BREAKEVENS] Безубытки отрендерены');
    } catch (error) {
        console.error('❌ [BREAKEVENS] Ошибка отображения безубытков:', error);
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
 * Переключение отображения премий
 */
togglePremium() {
    try {
        this.showPremiums = !this.showPremiums;
        
        const btn = document.getElementById('btn-prem');
        if (btn) {
            btn.innerText = this.showPremiums ? 'ON' : 'OFF';
            btn.classList.toggle('active', this.showPremiums);
        }
        
        this.reloadCurrentDTE();
        console.log('✅ [UI] Premium отображение переключено');
    } catch (error) {
        console.error('❌ [UI] Ошибка переключения премий:', error);
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
