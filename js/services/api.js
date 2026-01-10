// ============================================
// 🌐 API СЕРВИСЫ - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ============================================

const ApiService = {
    /**
     * Получение цены из Firebase - ИСПРАВЛЕНО
     */
    async getPrice() {
        try {
            console.log('💰 [API] Попытка загрузить цену...');
            
            // Пути для поиска цены
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
     * Получение данных для DTE - ИСПРАВЛЕНО
     */
    async getDTEData(dteKey) {
        try {
            console.log(`📥 [API] Загружаем данные для ${dteKey}...`);
            
            // Попробуем различные структуры
            let records = [];
            
            // Вариант 1: Данные в .data
            try {
                const snap1 = await firebase.database().ref(dteKey + '/data').once('value');
                if (snap1.exists()) {
                    const data = snap1.val();
                    records = Array.isArray(data) ? data : Object.values(data || {});
                    console.log(`✅ [API] Найдено в ${dteKey}/data: ${records.length} записей`);
                    return records.filter(r => r && r.s);
                }
            } catch (e) {
                console.log(`⚠️ Вариант ${dteKey}/data не подходит`);
            }
            
            // Вариант 2: Данные прямо в DTE
            try {
                const snap2 = await firebase.database().ref(dteKey).once('value');
                if (snap2.exists()) {
                    const val = snap2.val();
                    
                    // Проверяем структуру
                    if (val && val.data && Array.isArray(val.data)) {
                        records = val.data;
                        console.log(`✅ [API] Структура: ${dteKey}.data (массив)`);
                    } else if (val && val.data && typeof val.data === 'object') {
                        records = Object.values(val.data);
                        console.log(`✅ [API] Структура: ${dteKey}.data (объект)`);
                    } else if (Array.isArray(val)) {
                        records = val;
                        console.log(`✅ [API] Структура: ${dteKey} (массив)`);
                    } else if (typeof val === 'object') {
                        // Ищем объекты со свойством 's' (strike)
                        records = Object.values(val).filter(v => v && v.s);
                        console.log(`✅ [API] Структура: ${dteKey} (объект с s)`);
                    }
                    
                    if (records.length > 0) {
                        console.log(`✅ [API] Получено ${records.length} записей`);
                        return records;
                    }
                }
            } catch (e) {
                console.error(`❌ Ошибка при чтении ${dteKey}:`, e.message);
            }
            
            console.warn(`⚠️ [API] Нет данных для ${dteKey}`);
            return [];
            
        } catch (error) {
            console.error(`❌ [API] Ошибка получения данных для ${dteKey}:`, error);
            return [];
        }
    },
    
    /**
     * Получение аналитики для DTE - ИСПРАВЛЕНО
     */
    async getAnalytics(dte) {
        try {
            console.log(`📊 [API] Загружаем аналитику для DTE ${dte}...`);
            
            // Попробуем различные пути
            const paths = [
                `dte_${dte}/analytics`,
                `gc/analytics/dte_${dte}`,
                `gc/analytics/${dte}`,
                `analytics/dte_${dte}`,
                `dte_${dte}` // Может быть в корне с вложенными данными
            ];
            
            for (const path of paths) {
                try {
                    const snap = await firebase.database().ref(path).once('value');
                    
                    if (snap.exists()) {
                        const data = snap.val();
                        
                        // Если это объект с полями аналитики
                        if (data && (data.mp !== undefined || data.em !== undefined || data.atm !== undefined)) {
                            console.log(`✅ [API] Аналитика найдена в ${path}`);
                            return data;
                        }
                        
                        // Если это вложенный объект
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
     * Проверка существования DTE - ИСПРАВЛЕНО
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
                
                // Пытаемся получить дату истечения
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
     * Получение безубытков для DTE - ИСПРАВЛЕНО
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
                    // Различные варианты названия цены
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
    }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
} else {
    window.ApiService = ApiService;
}

console.log('✅ [API] ApiService загружен с исправлениями');
