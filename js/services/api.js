// ============================================
// 🌐 API СЕРВИСЫ
// ============================================

const ApiService = {
    /**
     * Получение цены из Firebase
     * @returns {Promise<number|null>} Текущая цена или null
     */
    async getPrice() {
        try {
            const paths = Constants.FIREBASE_PATHS.price;
            
            for (const path of paths) {
                try {
                    const snap = await firebase.database().ref(path).once('value');
                    const data = snap.val();
                    
                    if (data) {
                        let price = null;
                        
                        if (data.price !== undefined) price = parseFloat(data.price);
                        else if (data.underlying_price !== undefined) price = parseFloat(data.underlying_price);
                        else if (data.current_price !== undefined) price = parseFloat(data.current_price);
                        
                        if (price && !isNaN(price)) {
                            return price;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            // Пробуем получить цену из DTE данных
            return await this.getPriceFromDTE();
        } catch (error) {
            console.error('❌ Ошибка получения цены:', error);
            return null;
        }
    },
    
    /**
     * Получение цены из данных DTE
     * @returns {Promise<number|null>} Цена или null
     */
    async getPriceFromDTE() {
        const dteList = [1, 4, 5, 6, 7];
        
        for (const dte of dteList) {
            try {
                const snap = await firebase.database().ref(`dte_${dte}`).once('value');
                const data = snap.val();
                
                if (data && data.current_price !== undefined) {
                    const price = parseFloat(data.current_price);
                    if (!isNaN(price)) {
                        return price;
                    }
                }
            } catch (e) {
                continue;
            }
        }
        return null;
    },
    
    /**
     * Получение аналитики для DTE
     * @param {number} dte - DTE значение
     * @returns {Promise<Object|null>} Данные аналитики
     */
    async getAnalytics(dte) {
        try {
            const paths = Constants.FIREBASE_PATHS.analytics(dte);
            
            for (const path of paths) {
                try {
                    const snap = await firebase.database().ref(path).once('value');
                    const data = snap.val();
                    if (data) {
                        return data;
                    }
                } catch (e) {
                    continue;
                }
            }
            return null;
        } catch (error) {
            console.error(`❌ Ошибка получения аналитики для DTE ${dte}:`, error);
            return null;
        }
    },
    
    /**
     * Получение безубытков для DTE
     * @param {number} dte - DTE значение
     * @returns {Promise<Array>} Массив безубытков
     */
    async getBreakevens(dte) {
        try {
            const paths = Constants.FIREBASE_PATHS.breakevens(dte);
            
            for (const path of paths) {
                try {
                    const snap = await firebase.database().ref(path).once('value');
                    const data = snap.val();
                    if (data) {
                        return this.processBreakevensData(data);
                    }
                } catch (e) {
                    continue;
                }
            }
            return [];
        } catch (error) {
            console.error(`❌ Ошибка получения безубытков для DTE ${dte}:`, error);
            return [];
        }
    },
    
    /**
     * Обработка данных безубытков
     * @param {Object} data - Данные из Firebase
     * @returns {Array} Обработанный массив
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
     * Получение данных для DTE
     * @param {string} dteKey - Ключ DTE (например, 'dte_1')
     * @returns {Promise<Array>} Данные опционной цепи
     */
    async getDTEData(dteKey) {
        try {
            const snap = await firebase.database().ref(dteKey).once('value');
            const val = snap.val();
            let records = [];
            
            if (val && val.data) {
                records = val.data;
            } else if (Array.isArray(val)) {
                records = val;
            } else if (typeof val === 'object') {
                records = Object.values(val).filter(x => x && x.s);
            }
            
            return records;
        } catch (error) {
            console.error(`❌ Ошибка получения данных для ${dteKey}:`, error);
            return [];
        }
    },
    
    /**
     * Проверка существования DTE
     * @param {number} dte - DTE значение
     * @returns {Promise<Object|null>} Информация о DTE или null
     */
    async checkDTEExists(dte) {
        try {
            const snap = await firebase.database().ref(`dte_${dte}`).once('value');
            if (snap.exists()) {
                const data = snap.val();
                let expirationDate = null;
                
                if (data.metadata && data.metadata.expiration_date) {
                    expirationDate = new Date(data.metadata.expiration_date);
                } else {
                    const today = new Date();
                    expirationDate = new Date(today);
                    expirationDate.setDate(today.getDate() + dte);
                }
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (expirationDate < today) {
                    return null;
                }
                
                let displayName = '';
                const expDateStr = expirationDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
                if (dte === 0) displayName = `0DTE (Today - ${expDateStr})`;
                else if (dte === 1) displayName = `1DTE (Tomorrow - ${expDateStr})`;
                else displayName = `${dte}DTE (${expDateStr})`;
                
                return {
                    key: `dte_${dte}`,
                    idx: dte,
                    display: displayName,
                    expirationDate: expirationDate
                };
            }
        } catch (error) {
            console.error(`❌ Ошибка проверки DTE ${dte}:`, error);
        }
        return null;
    }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
} else {
    window.ApiService = ApiService;
}
