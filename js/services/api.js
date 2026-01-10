// ============================================
// 🌐 API СЕРВИСЫ - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ
// ============================================

const ApiService = {
    /**
     * Получение данных для DTE - ГЛАВНАЯ ФУНКЦИЯ
     */
    async getDTEData(dteKey) {
        try {
            console.log(`📥 [API] Загружаем данные для ${dteKey}...`);
            
            const snap = await firebase.database().ref(dteKey).once('value');
            
            if (!snap.exists()) {
                console.warn(`⚠️ [API] ${dteKey} не существует`);
                return [];
            }
            
            const val = snap.val();
            console.log(`📊 [API] Структура ${dteKey}:`, {
                hasData: !!val.data,
                isArray: Array.isArray(val.data),
                length: Array.isArray(val.data) ? val.data.length : 'N/A',
                keys: Object.keys(val).slice(0, 10)
            });
            
            let records = [];
            
            // ✅ Данные в .data массиве с формой {c: {...}, p: {...}, s: strike}
            if (val.data && Array.isArray(val.data)) {
                records = val.data.map(item => ({
                    s: item.s,  // strike
                    c: item.c || {},  // call data
                    p: item.p || {}   // put data
                }));
                
                console.log(`✅ [API] Найдено в ${dteKey}.data: ${records.length} записей`);
                console.log(`   Первая запись:`, records[0]);
                console.log(`   Последняя запись:`, records[records.length - 1]);
                
                return records;
            }
            
            console.error(`❌ [API] Неожиданная структура для ${dteKey}`);
            console.error(`   Ожидалось: .data как массив`);
            console.error(`   Получено:`, {
                type: typeof val,
                keys: Object.keys(val || {})
            });
            
            return [];
            
        } catch (error) {
            console.error(`❌ [API] Ошибка получения данных для ${dteKey}:`, error);
            return [];
        }
    },

    /**
     * Получение цены из Firebase
     */
    async getPrice() {
        try {
            console.log('💰 [API] Попытка загрузить цену...');
            
            const paths = [
                'current_price',
                'gc/live_data/current_price',
                'gc/current_price',
                'dte_0/current_price',
                'dte_1/current_price'
            ];
            
            for (const path of paths) {
                try {
                    console.log(`   📍 Проверяем: ${path}`);
                    const snap = await firebase.database().ref(path).once('value');
                    
                    if (snap.exists()) {
                        const data = snap.val();
                        console.log(`   ✅ Найдено в ${path}:`, data);
                        
                        let price = null;
                        if (typeof data === 'number') {
                            price = data;
                        } else if (data.price !== undefined) {
                            price = parseFloat(data.price);
                        } else if (data.current_price !== undefined) {
                            price = parseFloat(data.current_price);
                        } else if (data.underlying_price !== undefined) {
                            price = parseFloat(data.underlying_price);
                        }
                        
                        if (price && !isNaN(price) && price > 0) {
                            console.log(`✅ [PRICE] Цена получена: $${price}`);
                            return price;
                        }
                    }
                } catch (e) {
                    console.log(`   ⚠️ Ошибка при ${path}:`, e.message);
                    continue;
                }
            }
            
            console.warn('⚠️ [API] Цена не найдена в основных путях, пробуем DTE...');
            return await this.getPriceFromDTE();
            
        } catch (error) {
            console.error('❌ [API] Критическая ошибка получения цены:', error);
            return null;
        }
    },

    /**
     * Получение цены из DTE данных
     */
    async getPriceFromDTE() {
        const dteList = [0, 1, 2, 3, 4, 5];
        
        for (const dte of dteList) {
            try {
                const snap = await firebase.database().ref(`dte_${dte}`).once('value');
                const data = snap.val();
                
                if (data) {
                    let price = data.current_price || data.price || data.underlying_price;
                    
                    if (price !== undefined) {
                        price = parseFloat(price);
                        if (!isNaN(price) && price > 0) {
                            console.log(`✅ [API] Цена из DTE ${dte}: $${price}`);
                            return price;
                        }
                    }
                }
            } catch (e) {
                continue;
            }
        }
        
        console.warn('⚠️ [API] Цена не найдена ни в одном DTE');
        return null;
    },

    /**
     * Получение аналитики для DTE
     */
    async getAnalytics(dte) {
        try {
            console.log(`📊 [API] Загружаем аналитику для DTE ${dte}...`);
            
            const paths = [
                `dte_${dte}/analytics`,
                `gc/analytics/dte_${dte}`,
                `gc/analytics/${dte}`,
                `analytics/dte_${dte}`,
                `dte_${dte}`
            ];
            
            for (const path of paths) {
                try {
                    const snap = await firebase.database().ref(path).once('value');
                    
                    if (snap.exists()) {
                        const data = snap.val();
                        
                        if (data && (data.mp !== undefined || data.em !== undefined || data.atm !== undefined)) {
                            console.log(`✅ [API] Аналитика найдена в ${path}`);
                            return data;
                        }
                        
                        if (data && data.analytics) {
                            console.log(`✅ [API] Аналитика найдена в ${path}.analytics`);
                            return data.analytics;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            console.warn(`⚠️ [API] Аналитика не найдена для DTE ${dte}`);
            return null;
            
        } catch (error) {
            console.error(`❌ [API] Ошибка получения аналитики:`, error);
            return null;
        }
    },

    /**
     * Проверка существования DTE
     */
    async checkDTEExists(dte) {
        try {
            const dteKey = `dte_${dte}`;
            console.log(`🔍 [API] Проверяем ${dteKey}...`);
            
            const snap = await firebase.database().ref(dteKey).once('value');
            
            if (snap.exists()) {
                console.log(`✅ [API] ${dteKey} существует`);
                
                const data = snap.val();
                let expirationDate = null;
                
                if (data.metadata && data.metadata.expiration_date) {
                    expirationDate = new Date(data.metadata.expiration_date);
                } else if (data.expiration_date) {
                    expirationDate = new Date(data.expiration_date);
                } else {
                    const today = new Date();
                    expirationDate = new Date(today);
                    expirationDate.setDate(today.getDate() + dte);
                }
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (expirationDate < today) {
                    console.log(`⚠️ [API] ${dteKey} истек`);
                    return null;
                }
                
                const expDateStr = expirationDate.toLocaleDateString('ru-RU', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                });
                
                let displayName = '';
                if (dte === 0) displayName = `0DTE (Сегодня - ${expDateStr})`;
                else if (dte === 1) displayName = `1DTE (Завтра - ${expDateStr})`;
                else displayName = `${dte}DTE (${expDateStr})`;
                
                return {
                    key: dteKey,
                    idx: dte,
                    display: displayName,
                    expirationDate: expirationDate
                };
            }
            
            console.log(`⚠️ [API] ${dteKey} не найден`);
            return null;
            
        } catch (error) {
            console.error(`❌ [API] Ошибка проверки DTE ${dte}:`, error);
            return null;
        }
    },

    /**
     * Получение безубытков для DTE
     */
    async getBreakevens(dte) {
        try {
            console.log(`🎯 [API] Загружаем безубытки для DTE ${dte}...`);
            
            const paths = [
                `dte_${dte}/breakevens`,
                `gc/breakevens/dte_${dte}`,
                `breakevens/dte_${dte}`,
                `breakevens/${dte}`
            ];
            
            for (const path of paths) {
                try {
                    const snap = await firebase.database().ref(path).once('value');
                    
                    if (snap.exists()) {
                        const data = snap.val();
                        console.log(`✅ [API] Безубытки найдены в ${path}`);
                        return this.processBreakevensData(data);
                    }
                } catch (e) {
                    continue;
                }
            }
            
            console.warn(`⚠️ [API] Безубытки не найдены для DTE ${dte}`);
            return [];
            
        } catch (error) {
            console.error(`❌ [API] Ошибка получения безубытков:`, error);
            return [];
        }
    },

    /**
     * Обработка данных безубытков
     */
    processBreakevensData(data) {
        let allBreakevens = [];
        
        if (data.calls && Array.isArray(data.calls)) {
            allBreakevens = allBreakevens.concat(
                data.calls.map(call => ({
                    ...call,
                    type: 'CALL',
                    s: call.s || call.strike,
                    be: call.be || call.breakeven,
                    v: call.v || call.vol,
                    oi: call.oi || 0,
                    pr: call.pr || call.premium || 0
                }))
            );
        }
        
        if (data.puts && Array.isArray(data.puts)) {
            allBreakevens = allBreakevens.concat(
                data.puts.map(put => ({
                    ...put,
                    type: 'PUT',
                    s: put.s || put.strike,
                    be: put.be || put.breakeven,
                    v: put.v || put.vol,
                    oi: put.oi || 0,
                    pr: put.pr || put.premium || 0
                }))
            );
        }
        
        if (!allBreakevens.length && Array.isArray(data)) {
            allBreakevens = data.map(b => ({
                ...b,
                type: b.type || (b.s > (window.app?.currentPrice || 2600) ? 'CALL' : 'PUT'),
                s: b.s || b.strike,
                be: b.be || b.breakeven,
                v: b.v || b.vol,
                oi: b.oi || 0,
                pr: b.pr || b.premium || 0
            }));
        }
        
        if (!allBreakevens.length && typeof data === 'object') {
            const values = Object.values(data).filter(v => v && v.s);
            if (values.length > 0) {
                allBreakevens = values.map(b => ({
                    ...b,
                    type: b.type || (b.s > (window.app?.currentPrice || 2600) ? 'CALL' : 'PUT'),
                    s: b.s || b.strike,
                    be: b.be || b.breakeven,
                    v: b.v || b.vol,
                    oi: b.oi || 0,
                    pr: b.pr || b.premium || 0
                }));
            }
        }
        
        return allBreakevens;
    }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
} else {
    window.ApiService = ApiService;
}

console.log('✅ [API] ApiService загружен');
