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
    
    /**
     * Инициализация приложения
     */
    async init() {
        if (this.initialized) return;
        
        console.log('🚀 Запуск основного приложения...');
        
        // Определяем тип пользователя
        this.isTrial = window.AuthModule?.currentUser ? 
            (window.AuthModule.currentUser.plan !== "PREMIUM" || window.AuthModule.isSubscriptionExpired(window.AuthModule.currentUser)) : 
            true;
        
        // Обновляем UI в зависимости от типа пользователя
        this.updateUIForUserType();
        
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
        
        // Инициализируем MT5 модуль
        if (window.MT5Module) {
            MT5Module.init();
        }
        
        this.initialized = true;
        console.log('✅ Приложение инициализировано');
    },
    
    /**
     * Обновление UI для типа пользователя
     */
    updateUIForUserType() {
        if (this.isTrial) {
            console.log('🔒 Применение TRIAL ограничений...');
            this.applyTrialRestrictions();
        } else {
            console.log('🔓 Разблокировка PREMIUM функций...');
            this.removePremiumBlocks();
        }
    },
    
    /**
     * Применение ограничений TRIAL
     */
    applyTrialRestrictions() {
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
    },
    
    /**
     * Разблокировка PREMIUM функций
     */
    removePremiumBlocks() {
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
    },
    
    /**
     * Показ уведомления о TRIAL
     */
    showTrialNotification() {
        const daysLeft = window.AuthModule ? AuthModule.getDaysLeft() : 3;
        if (daysLeft <= 0) return;
        
        const existing = document.querySelector('.trial-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'trial-notification';
        notification.innerHTML = `
            <button class="trial-notification-close" onclick="this.parentElement.remove()">×</button>
            <div class="trial-notification-title">⚡ TRIAL РЕЖИМ</div>
            <div class="trial-notification-text">
                Доступны только базовые функции. ${daysLeft} дней осталось до окончания триала.
                Для полного доступа обновитесь до PREMIUM
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) notification.remove();
        }, 10000);
    },
    
    /**
     * Запуск обновления цены
     */
    startPriceUpdates() {
        console.log('💰 Запуск обновления цены...');
        
        this.updatePrice();
        
        setInterval(() => {
            this.updatePrice();
        }, Constants.APP_SETTINGS.priceUpdateInterval);
    },
    
    /**
     * Запуск обновления данных
     */
    startDataUpdates() {
        console.log('📊 Запуск обновления данных...');
        
        this.updateData();
        
        setInterval(() => {
            this.updateData();
        }, Constants.APP_SETTINGS.dataUpdateInterval);
    },
    
    /**
     * Запуск обновления аналитики
     */
    startAnalyticsUpdates() {
        console.log('📈 Запуск обновления аналитики...');
        
        this.updateAnalytics();
        
        setInterval(() => {
            this.updateAnalytics();
        }, Constants.APP_SETTINGS.analyticsUpdateInterval);
    },
    
    /**
     * Обновление цены
     */
    async updatePrice() {
        try {
            const price = await ApiService.getPrice();
            
            if (price && !isNaN(price)) {
                this.currentPrice = price;
                this.priceSet = true;
                this.updatePriceUI(price);
                
                const connStatus = document.getElementById('connStatus');
                if (connStatus) {
                    connStatus.innerHTML = '<span style="color:#00E676">🟢 LIVE CONNECTION</span>';
                }
            }
        } catch (error) {
            console.error('❌ Ошибка обновления цены:', error);
            
            const connStatus = document.getElementById('connStatus');
            if (connStatus) {
                connStatus.innerHTML = '<span style="color:#ff4444">🔴 OFFLINE - Error</span>';
            }
        }
    },
    
    /**
     * Обновление данных
     */
    async updateData() {
        if (this.dteList.length === 0) return;
        
        const currentDTE = this.dteList[this.currentDTEIndex];
        console.log(`🔄 Обновление данных для ${currentDTE.key}...`);
        
        // Очищаем кэш
        CacheService.delete(Constants.CACHE_VERSION + ':' + currentDTE.key);
        
        // Загружаем данные заново
        await this.loadData(this.currentDTEIndex);
    },
    
    /**
     * Обновление аналитики
     */
    async updateAnalytics() {
        if (this.dteList.length === 0) return;
        
        const currentDTE = this.dteList[this.currentDTEIndex];
        console.log(`📈 Обновление аналитики для DTE ${currentDTE.idx}...`);
        
        const analyticsData = await ApiService.getAnalytics(currentDTE.idx);
        
        if (analyticsData) {
            this.updateAnalyticsUI(analyticsData);
        }
    },
    
    /**
     * Загрузка начальных данных
     */
    async loadInitialData() {
        console.log('📥 Загрузка начальных данных...');
        
        const price = await ApiService.getPrice();
        if (price && !isNaN(price)) {
            this.currentPrice = price;
            this.priceSet = true;
            this.updatePriceUI(price);
        }
    },
    
    /**
     * Загрузка списка DTE
     */
    async loadDTEList() {
        console.log('📅 Загрузка списка DTE...');
        
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
        
        const results = await Promise.all(promises);
        this.dteList = results.filter(item => item !== null);
        this.dteList.sort((a, b) => a.idx - b.idx);
        
        if (this.dteList.length > 0) {
            this.renderDTEButtons();
            await this.loadData(0);
            
            const dteDisplay = document.getElementById('current-dte-display');
            if (dteDisplay) {
                dteDisplay.innerText = this.dteList[0].idx;
            }
        } else if (container) {
            container.innerHTML = '<span style="color:#ff4444">No expiration data found</span>';
        }
        
        console.log(`✅ Найдено DTE: ${this.dteList.length}`);
    },
    
    /**
     * Рендеринг кнопок DTE
     */
    renderDTEButtons() {
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
        
        if (this.dteList.length > 0) {
            const tableLabel = document.getElementById('table-dte-label');
            if (tableLabel) {
                tableLabel.innerText = `EXPIRATION: ${this.dteList[0].display}`;
            }
        }
    },
    
    /**
     * Загрузка данных для DTE
     */
    async loadData(index) {
        if (index >= this.dteList.length) return;
        
        this.currentDTEIndex = index;
        const dteItem = this.dteList[index];
        
        const tableLabel = document.getElementById('table-dte-label');
        if (tableLabel) {
            tableLabel.innerText = `EXPIRATION: ${dteItem.display}`;
        }
        
        const cacheKey = Constants.CACHE_VERSION + ':' + dteItem.key;
        
        // Проверяем кэш
        let records = CacheService.get(cacheKey);
        
        if (!records) {
            console.log(`📥 Загрузка данных для ${dteItem.key}...`);
            records = await ApiService.getDTEData(dteItem.key);
            
            if (records.length > 0) {
                CacheService.set(cacheKey, records);
            }
        } else {
            console.log(`📊 Используем кэшированные данные для ${dteItem.key}`);
        }
        
        if (records.length > 0) {
            this.renderTable(records);
            
            if (window.ChartsModule) {
                ChartsModule.createAllCharts(records);
            }
            
            this.updateTopStats(records);
            this.updateAnalyticsForDTE(dteItem.idx);
            this.loadBreakevensForDTE(dteItem.idx);
        }
    },
    
    /**
     * Обновление аналитики для DTE
     */
    async updateAnalyticsForDTE(dte) {
        const analyticsData = await ApiService.getAnalytics(dte);
        if (analyticsData) {
            this.updateAnalyticsUI(analyticsData);
        }
    },
    
    /**
     * Загрузка безубытков для DTE
     */
    async loadBreakevensForDTE(dte) {
        const breakevens = await ApiService.getBreakevens(dte);
        this.displayTopBreakevens(breakevens);
    },
    
    /**
     * Рендеринг таблицы
     */
    renderTable(records) {
        const tbody = document.getElementById('table-body');
        if (!tbody || !records || records.length === 0) return;
        
        let workingPrice = this.currentPrice;
        if (workingPrice <= 0) {
            const sorted = [...records].sort((a,b) => parseFloat(a.s) - parseFloat(b.s));
            if (sorted.length > 0) {
                workingPrice = parseFloat(sorted[Math.floor(sorted.length/2)].s);
            } else {
                workingPrice = 2600;
            }
        }
        
        const sorted = [...records].sort((a, b) => parseFloat(a.s) - parseFloat(b.s));
        let atmStrike = null;
        let minDiff = Infinity;
        
        sorted.forEach(r => {
            const diff = Math.abs(parseFloat(r.s) - workingPrice);
            if (diff < minDiff) {
                minDiff = diff;
                atmStrike = parseFloat(r.s);
            }
        });
        
        const halfCount = Math.floor(this.displayCount / 2);
        const startIdx = Math.max(0, sorted.findIndex(r => parseFloat(r.s) === atmStrike) - halfCount);
        const endIdx = Math.min(sorted.length, startIdx + this.displayCount);
        const displayRecords = sorted.slice(startIdx, endIdx);
        
        let html = '';
        displayRecords.forEach(r => {
            const strike = parseFloat(r.s);
            const isATM = strike === atmStrike;
            const call = r.c || {};
            const put = r.p || {};
            let displayedStrike = strike + this.forwardAdj;
            
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
            
            const callOI = call.oi || 0;
            const callVol = call.vol || 0;
            const putOI = put.oi || 0;
            const putVol = put.vol || 0;
            const callPrem = call.pr || 0;
            const putPrem = put.pr || 0;
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
                    <td>${call.d ? call.d.toFixed(4) : '-'}</td>
                    <td>${call.g ? call.g.toFixed(4) : '-'}</td>
                    <td>${call.iv ? call.iv.toFixed(2) : '-'}</td>
                    <td class="strike-cell">
                        <div style="text-align: center;">
                            <div style="font-size: 0.75em; color: #888; margin-bottom: 3px;">STRIKE</div>
                            <div style="font-weight: 800; color: var(--gold); font-size: 1.1em;">$${displayedStrike.toFixed(1)}</div>
                            ${this.showPremiums ? `
                                <div style="display: flex; justify-content: space-around; margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
                                    <div style="font-size: 0.7em; color: var(--call);">
                                        C: $${callStrike}
                                    </div>
                                    <div style="font-size: 0.7em; color: var(--put);">
                                        P: $${putStrike}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </td>
                    <td>${put.iv ? put.iv.toFixed(2) : '-'}</td>
                    <td>${put.g ? put.g.toFixed(4) : '-'}</td>
                    <td>${put.d ? put.d.toFixed(4) : '-'}</td>
                    <td style="color: ${this.showPremiums ? 'var(--put)' : '#888'}; font-weight: ${this.showPremiums ? '700' : '400'}; background: ${this.showPremiums ? 'rgba(255, 23, 68, 0.1)' : 'transparent'};">
                        ${putPremDisplay}
                    </td>
                    <td style="background: ${getColorForValue(putVol)}; font-weight: 600;">${putVol}</td>
                    <td style="background: ${getColorForValue(putOI)}; font-weight: 600;">${putOI}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    },
    
    /**
     * Обновление статистики
     */
    updateTopStats(records) {
        if (!records || records.length === 0) return;
        
        const sorted = [...records].sort((a, b) => parseFloat(a.s) - parseFloat(b.s));
        const adjustedRecords = sorted.map(r => ({
            ...r,
            adjusted_s: parseFloat(r.s) + this.forwardAdj,
            call_prem: r.c?.pr || 0,
            put_prem: r.p?.pr || 0
        }));
        
        const topCallOI = adjustedRecords
            .map(r => ({ strike: parseFloat(r.s), adjusted_strike: r.adjusted_s, value: r.c?.oi || 0, prem: r.call_prem }))
            .sort((a, b) => b.value - a.value).slice(0, 5);
            
        const topPutOI = adjustedRecords
            .map(r => ({ strike: parseFloat(r.s), adjusted_strike: r.adjusted_s, value: r.p?.oi || 0, prem: r.put_prem }))
            .sort((a, b) => b.value - a.value).slice(0, 5);
            
        const topCallVol = adjustedRecords
            .map(r => ({ strike: parseFloat(r.s), adjusted_strike: r.adjusted_s, value: r.c?.vol || 0, prem: r.call_prem }))
            .sort((a, b) => b.value - a.value).slice(0, 5);
            
        const topPutVol = adjustedRecords
            .map(r => ({ strike: parseFloat(r.s), adjusted_strike: r.adjusted_s, value: r.p?.vol || 0, prem: r.put_prem }))
            .sort((a, b) => b.value - a.value).slice(0, 5);
        
        this.updateTopStatList('top-call-oi', topCallOI);
        this.updateTopStatList('top-put-oi', topPutOI);
        this.updateTopStatList('top-call-vol', topCallVol);
        this.updateTopStatList('top-put-vol', topPutVol);
    },
    
    /**
     * Обновление списка статистики
     */
    updateTopStatList(elementId, data) {
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
                <div class="top-stat-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(40, 40, 40, 0.5); border-radius: 6px; margin-bottom: 6px;">
                    <div style="display: flex; flex-direction: column;">
                        <span class="top-stat-strike" style="font-weight: 700; color: ${textColor}; font-size: 1.05em;">
                            $${adjustedStrike.toFixed(1)}
                        </span>
                        ${this.showPremiums && item.prem ? `
                            <span style="font-size: 0.7em; color: #888; margin-top: 2px;">
                                (Base: $${item.adjusted_strike.toFixed(1)} ${isCall ? '+' : '-'} $${item.prem.toFixed(2)})
                            </span>
                        ` : ''}
                    </div>
                    <span class="top-stat-value" style="font-weight: 800; color: ${textColor}; font-size: 1.1em;">${item.value.toLocaleString()}</span>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Обновление UI цены
     */
    updatePriceUI(price) {
        const el = document.getElementById('price');
        if (!el) return;
        
        el.innerText = '$' + price.toFixed(2);
        el.classList.remove('pulse');
        void el.offsetWidth;
        el.classList.add('pulse');
    },
    
    /**
     * Обновление UI аналитики
     */
    updateAnalyticsUI(data) {
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
        
        // Ванна/Чарм
        if (data.v) {
            if (data.v.n_v !== undefined) {
                const vannaEl = document.getElementById('vanna');
                if (vannaEl) vannaEl.innerText = parseFloat(data.v.n_v).toFixed(2);
            }
            
            if (data.v.ch !== undefined) {
                const charmEl = document.getElementById('charm');
                if (charmEl) charmEl.innerText = parseFloat(data.v.ch).toFixed(4);
            }
            
            if (data.v.c_v !== undefined) {
                const colorEl = document.getElementById('color');
                if (colorEl) colorEl.innerText = parseFloat(data.v.c_v).toFixed(2);
            }
        }
        
        // Вероятность ITM
        if (data.p) {
            if (data.p.c !== undefined) {
                const probCEl = document.getElementById('prob-c');
                if (probCEl) probCEl.innerText = parseFloat(data.p.c).toFixed(1) + '%';
            }
            
            if (data.p.p !== undefined) {
                const probPEl = document.getElementById('prob-p');
                if (probPEl) probPEl.innerText = parseFloat(data.p.p).toFixed(1) + '%';
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
    },
    
    /**
     * Отображение TOP 10 безубытков
     */
    displayTopBreakevens(breakevens) {
        const container = document.getElementById('top-breakevens');
        if (!container) return;
        
        if (!breakevens || breakevens.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#888; padding:30px;">No breakeven data available</div>';
            return;
        }
        
        const displayBreakevens = breakevens.slice(0, 10);
        
        container.innerHTML = displayBreakevens.map((b, index) => `
            <div style="background:${b.type === 'CALL' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 23, 68, 0.1)'}; border:2px solid ${b.type === 'CALL' ? 'var(--call)' : 'var(--put)'}; border-radius:10px; padding:15px; position: relative;">
                <div style="position: absolute; top: -12px; left: 10px; background: var(--gold); color: #000; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: 800; font-size: 0.9em;">${index + 1}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; margin-top: 5px;">
                    <div style="font-weight:800; font-size:1.1em; color:${b.type === 'CALL' ? 'var(--call)' : 'var(--put)'};">${b.type}</div>
                    <div style="font-weight:700; color:var(--gold); font-size:1.2em;">$${b.be?.toFixed(1) || b.s?.toFixed(1) || '0'}</div>
                </div>
                <div style="font-size:0.85em; color:#ccc; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <div style="color: #888; font-size: 0.75em;">Strike</div>
                        <div style="font-weight: 700;">$${b.s?.toFixed(1) || '0'}</div>
                    </div>
                    <div>
                        <div style="color: #888; font-size: 0.75em;">Premium</div>
                        <div style="font-weight: 700; color: var(--gold);">$${b.pr?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div>
                        <div style="color: #888; font-size: 0.75em;">OI</div>
                        <div style="font-weight: 600;">${b.oi || 0}</div>
                    </div>
                    <div>
                        <div style="color: #888; font-size: 0.75em;">Volume</div>
                        <div style="font-weight: 600;">${b.v || b.vol || 0}</div>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    /**
     * Обновление времени
     */
    updateTime() {
        const now = new Date();
        const updatedEl = document.getElementById('updated');
        if (updatedEl) {
            updatedEl.innerText = now.toLocaleTimeString();
        }
    },
    
    /**
     * Установка количества страйков
     */
    setStrikeCount(n) {
        if (this.isTrial && n !== 15) {
            this.showNotification('Изменение количества страйков доступно только в PREMIUM версии', 'warning');
            return;
        }
        
        this.displayCount = n;
        
        document.querySelectorAll('button[data-cnt]').forEach(b => {
            b.classList.remove('active');
        });
        
        const clickedBtn = document.querySelector(`button[data-cnt="${n}"]`);
        if (clickedBtn) {
            clickedBtn.classList.add('active');
        }
        
        this.reloadCurrentDTE();
    },
    
    /**
     * Переключение отображения премий
     */
    togglePremium() {
        this.showPremiums = !this.showPremiums;
        
        const btn = document.getElementById('btn-prem');
        if (btn) {
            btn.innerText = this.showPremiums ? 'ON' : 'OFF';
            btn.classList.toggle('active', this.showPremiums);
        }
        
        this.reloadCurrentDTE();
    },
    
    /**
     * Применение коррекции вперед
     */
    applyForwardAdjustment() {
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
    },
    
    /**
     * Перезагрузка текущего DTE
     */
    reloadCurrentDTE() {
        if (this.dteList.length === 0) return;
        
        const dteItem = this.dteList[this.currentDTEIndex];
        const cacheKey = Constants.CACHE_VERSION + ':' + dteItem.key;
        
        CacheService.delete(cacheKey);
        this.loadData(this.currentDTEIndex);
    },
    
    /**
     * Показ уведомления
     */
    showNotification(message, type = 'info') {
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
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:8px; height:8px; border-radius:50%; background:${colors[type]};"></div>
                <div>${message}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
        
        // Добавляем стили анимации, если их еще нет
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn { 
                    from { transform: translateX(100%); opacity: 0; } 
                    to { transform: translateX(0); opacity: 1; } 
                }
                @keyframes slideOut { 
                    from { transform: translateX(0); opacity: 1; } 
                    to { transform: translateX(100%); opacity: 0; } 
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    /**
     * Очистка приложения
     */
    cleanup() {
        console.log('🧹 Очистка приложения...');
        
        // Очищаем графики
        if (window.ChartsModule) {
            ChartsModule.destroyAllCharts();
        }
        
        // Очищаем кэш
        if (window.CacheService) {
            CacheService.clear();
        }
        
        this.initialized = false;
    }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
} else {
    window.app = App;
}
