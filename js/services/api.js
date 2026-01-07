// ============================================
// 📡 СЕРВИС ДЛЯ РАБОТЫ С API
// ============================================

const ApiService = {
    /**
     * Получение данных из Firebase по указанному пути
     * @param {string} path - Путь в Firebase
     * @returns {Promise<any>} - Данные
     */
    async getFirebaseData(path) {
        try {
            const snapshot = await firebase.database().ref(path).once('value');
            return snapshot.val();
        } catch (error) {
            console.error(`❌ Ошибка получения данных из Firebase (${path}):`, error);
            throw error;
        }
    },
    
    /**
     * Обновление данных в Firebase
     * @param {string} path - Путь в Firebase
     * @param {object} data - Данные для обновления
     */
    async updateFirebaseData(path, data) {
        try {
            await firebase.database().ref(path).update(data);
            console.log(`✅ Данные обновлены в Firebase (${path})`);
        } catch (error) {
            console.error(`❌ Ошибка обновления данных в Firebase (${path}):`, error);
            throw error;
        }
    },
    
    /**
     * Установка данных в Firebase
     * @param {string} path - Путь в Firebase
     * @param {object} data - Данные для установки
     */
    async setFirebaseData(path, data) {
        try {
            await firebase.database().ref(path).set(data);
            console.log(`✅ Данные установлены в Firebase (${path})`);
        } catch (error) {
            console.error(`❌ Ошибка установки данных в Firebase (${path}):`, error);
            throw error;
        }
    },
    
    /**
     * Отправка сигнала в MT5
     * @param {object} signalData - Данные сигнала
     * @returns {Promise<object>} - Ответ от сервера
     */
    async sendMT5Signal(signalData) {
        try {
            const response = await axios.post(`${signalData.endpoint}/signal`, signalData, {
                timeout: 5000
            });
            return response.data;
        } catch (error) {
            console.error('❌ Ошибка отправки сигнала в MT5:', error);
            throw error;
        }
    },
    
    /**
     * Проверка соединения с MT5
     * @param {string} endpoint - URL эндпоинта MT5
     * @returns {Promise<boolean>} - Статус соединения
     */
    async checkMT5Connection(endpoint) {
        try {
            const response = await axios.get(`${endpoint}/ping`, {
                timeout: 3000
            });
            return response.data && response.data.status === 'ok';
        } catch (error) {
            console.error('❌ Ошибка проверки соединения с MT5:', error);
            return false;
        }
    },
    
    /**
     * Получение статуса MT5
     * @param {string} endpoint - URL эндпоинта MT5
     * @returns {Promise<object>} - Статус MT5
     */
    async getMT5Status(endpoint) {
        try {
            const response = await axios.get(`${endpoint}/status`, {
                timeout: 3000
            });
            return response.data;
        } catch (error) {
            console.error('❌ Ошибка получения статуса MT5:', error);
            throw error;
        }
    },
    
    /**
     * Отправка безубытков в MT5
     * @param {string} endpoint - URL эндпоинта MT5
     * @param {object} breakevenData - Данные безубытков
     * @returns {Promise<object>} - Ответ от сервера
     */
    async sendMT5Breakevens(endpoint, breakevenData) {
        try {
            const response = await axios.post(`${endpoint}/breakevens`, breakevenData, {
                timeout: 5000
            });
            return response.data;
        } catch (error) {
            console.error('❌ Ошибка отправки безубытков в MT5:', error);
            throw error;
        }
    }
};

// Экспорт в глобальную область видимости
window.ApiService = ApiService;
