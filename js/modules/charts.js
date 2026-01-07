// ============================================
// 📈 МОДУЛЬ ДЛЯ РАБОТЫ С ГРАФИКАМИ
// ============================================

const ChartsModule = {
    // Хранилище графиков
    charts: {},
    
    /**
     * Инициализация модуля графиков
     */
    init() {
        console.log('📊 Инициализация модуля графиков...');
        this.charts = {};
    },
    
    /**
     * Создание графика
     * @param {string} id - ID canvas элемента
     * @param {object} config - Конфигурация графика
     * @returns {Chart|null} - Созданный график или null
     */
    createChart(id, config) {
        const ctx = document.getElementById(id);
        if (!ctx) {
            console.error(`❌ Canvas элемент с ID "${id}" не найден`);
            return null;
        }
        
        // Уничтожаем старый график, если существует
        if (this.charts[id]) {
            this.charts[id].destroy();
        }
        
        try {
            // Создаем новый график
            this.charts[id] = new Chart(ctx, config);
            console.log(`✅ График "${id}" создан`);
            return this.charts[id];
        } catch (error) {
            console.error(`❌ Ошибка создания графика "${id}":`, error);
            return null;
        }
    },
    
    /**
     * Уничтожение графика
     * @param {string} id - ID графика
     */
    destroyChart(id) {
        if (this.charts[id]) {
            this.charts[id].destroy();
            delete this.charts[id];
            console.log(`🗑️ График "${id}" уничтожен`);
        }
    },
    
    /**
     * Уничтожение всех графиков
     */
    destroyAllCharts() {
        Object.keys(this.charts).forEach(id => {
            this.destroyChart(id);
        });
        console.log('🗑️ Все графики уничтожены');
    },
    
    /**
     * Обновление данных графика
     * @param {string} id - ID графика
     * @param {object} newData - Новые данные
     */
    updateChartData(id, newData) {
        if (!this.charts[id]) {
            console.error(`❌ График "${id}" не найден`);
            return;
        }
        
        try {
            this.charts[id].data = newData;
            this.charts[id].update();
            console.log(`✅ Данные графика "${id}" обновлены`);
        } catch (error) {
            console.error(`❌ Ошибка обновления графика "${id}":`, error);
        }
    },
    
    /**
     * Обновление опций графика
     * @param {string} id - ID графика
     * @param {object} newOptions - Новые опции
     */
    updateChartOptions(id, newOptions) {
        if (!this.charts[id]) {
            console.error(`❌ График "${id}" не найден`);
            return;
        }
        
        try {
            this.charts[id].options = newOptions;
            this.charts[id].update();
            console.log(`✅ Опции графика "${id}" обновлены`);
        } catch (error) {
            console.error(`❌ Ошибка обновления опций графика "${id}":`, error);
        }
    },
    
    /**
     * Получение графика по ID
     * @param {string} id - ID графика
     * @returns {Chart|undefined} - График
     */
    getChart(id) {
        return this.charts[id];
    },
    
    /**
     * Получение списка всех графиков
     * @returns {Array} - Массив объектов графиков
     */
    getAllCharts() {
        return Object.entries(this.charts).map(([id, chart]) => ({
            id,
            type: chart.config.type,
            data: chart.data,
            options: chart.options
        }));
    },
    
    /**
     * Рендеринг всех графиков на основе данных
     * @param {Array} records - Данные для графиков
     */
    renderAllCharts(records) {
        if (!records || records.length < 5) {
            console.warn('Недостаточно данных для графиков');
            this.showNoDataOnCharts();
            return;
        }
        
        const sorted = [...records].sort((a,b) => parseFloat(a.s) - parseFloat(b.s));
        const filtered = sorted;
        
        if (filtered.length < 5) {
            console.warn('Отфильтрованных данных слишком мало для графиков');
            this.showNoDataOnCharts();
            return;
        }
        
        const labels = filtered.map(r => parseFloat(r.s).toFixed(0));
        const strikes = filtered.map(r => parseFloat(r.s));
        
        // Подготовка данных
        const datasets = this.prepareChartData(filtered, strikes);
        
        // Создание графиков
        this.createOIChart(labels, datasets);
        this.createVolumeChart(labels, datasets);
        this.createIVChart(labels, datasets);
        this.createMaxPainChart(labels, strikes, filtered);
        this.createGammaChart(labels, datasets);
        this.createDeltaChart(labels, datasets);
        this.createGEXChart(labels, datasets);
        this.createThetaChart(labels, datasets);
    },
    
    /**
     * Подготовка данных для графиков
     */
    prepareChartData(filtered, strikes) {
        return {
            callOI: filtered.map(r => r.c?.oi || 0),
            putOI: filtered.map(r => r.p?.oi || 0),
            callVol: filtered.map(r => r.c?.vol || 0),
            putVol: filtered.map(r => r.p?.vol || 0),
            callIV: filtered.map(r => r.c?.iv || 0),
            putIV: filtered.map(r => r.p?.iv || 0),
            callDelta: filtered.map(r => (r.c?.d || 0) * (r.c?.oi || 0) / 100),
            putDelta: filtered.map(r => (r.p?.d || 0) * (r.p?.oi || 0) / 100),
            callTheta: filtered.map(r => r.c?.t || 0),
            putTheta: filtered.map(r => r.p?.t || 0),
            netGamma: filtered.map(r => {
                const callGamma = (r.c?.g || 0) * (r.c?.oi || 0);
                const putGamma = (r.p?.g || 0) * (r.p?.oi || 0);
                return callGamma - putGamma;
            }),
            netGEX: filtered.map(r => {
                const strike = parseFloat(r.s);
                const callGEX = (r.c?.oi || 0) * (r.c?.g || 0) * strike * 100;
                const putGEX = (r.p?.oi || 0) * (r.p?.g || 0) * strike * 100;
                return (callGEX - putGEX) / 1000000;
            })
        };
    },
    
    /**
     * Создание графика Open Interest
     */
    createOIChart(labels, datasets) {
        this.createChart('chart-oi', {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Call OI',
                        data: datasets.callOI,
                        backgroundColor: 'rgba(0, 230, 118, 0.7)',
                        borderColor: '#00E676',
                        borderWidth: 1
                    },
                    {
                        label: 'Put OI',
                        data: datasets.putOI.map(v => -v),
                        backgroundColor: 'rgba(255, 23, 68, 0.7)',
                        borderColor: '#FF1744',
                        borderWidth: 1
                    }
                ]
            },
            options: this.getCommonChartOptions('Open Interest Distribution', 'Open Interest')
        });
    },
    
    /**
     * Создание графика Volume
     */
    createVolumeChart(labels, datasets) {
        this.createChart('chart-vol', {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Call Volume',
                        data: datasets.callVol,
                        backgroundColor: 'rgba(0, 230, 118, 0.6)',
                        borderColor: '#00E676',
                        borderWidth: 1
                    },
                    {
                        label: 'Put Volume',
                        data: datasets.putVol.map(v => -v),
                        backgroundColor: 'rgba(255, 23, 68, 0.6)',
                        borderColor: '#FF1744',
                        borderWidth: 1
                    }
                ]
            },
            options: this.getCommonChartOptions('Volume Heatmap', 'Volume')
        });
    },
    
    /**
     * Создание графика IV Smile
     */
    createIVChart(labels, datasets) {
        this.createChart('chart-iv', {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Call IV',
                        data: datasets.callIV,
                        borderColor: '#00E676',
                        backgroundColor: 'rgba(0, 230, 118, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3
                    },
                    {
                        label: 'Put IV',
                        data: datasets.putIV,
                        borderColor: '#FF1744',
                        backgroundColor: 'rgba(255, 23, 68, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3
                    }
                ]
            },
            options: this.getCommonChartOptions('IV Smile Curve', 'Implied Volatility (%)')
        });
    },
    
    /**
     * Создание графика Max Pain
     */
    createMaxPainChart(labels, strikes, filtered) {
        const losses = strikes.map(k => {
            let loss = 0;
            filtered.forEach(rec => {
                const s = parseFloat(rec.s);
                if (k < s) loss += (s - k) * (rec.c?.oi || 0);
                if (k > s) loss += (k - s) * (rec.p?.oi || 0);
            });
            return loss;
        });
        
        this.createChart('chart-mp', {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Max Pain',
                        data: losses,
                        borderColor: '#FFD700',
                        backgroundColor: 'rgba(255, 215, 0, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4
                    }
                ]
            },
            options: this.getCommonChartOptions('Max Pain Curve', 'Loss ($)')
        });
    },
    
    /**
     * Создание графика Gamma
     */
    createGammaChart(labels, datasets) {
        this.createChart('chart-gamma', {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Net Gamma',
                        data: datasets.netGamma,
                        borderColor: '#9C27B0',
                        backgroundColor: 'rgba(156, 39, 176, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3
                    }
                ]
            },
            options: this.getCommonChartOptions('Gamma Exposure', 'Net Gamma')
        });
    },
    
    /**
     * Создание графика Delta
     */
    createDeltaChart(labels, datasets) {
        this.createChart('chart-delta', {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Call Delta',
                        data: datasets.callDelta,
                        borderColor: '#00E676',
                        backgroundColor: 'rgba(0, 230, 118, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Put Delta',
                        data: datasets.putDelta,
                        borderColor: '#FF1744',
                        backgroundColor: 'rgba(255, 23, 68, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: this.getCommonChartOptions('Delta Profile', 'Delta Exposure')
        });
    },
    
    /**
     * Создание графика GEX
     */
    createGEXChart(labels, datasets) {
        this.createChart('chart-gex', {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Net GEX',
                        data: datasets.netGEX,
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3
                    }
                ]
            },
            options: {
                ...this.getCommonChartOptions('GEX Profile', 'GEX ($ Millions)'),
                scales: {
                    x: this.getCommonXAxisOptions(),
                    y: {
                        ...this.getCommonYAxisOptions(),
                        title: {
                            display: true,
                            text: 'GEX ($ Millions)',
                            color: '#888'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + 'M';
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Создание графика Theta
     */
    createThetaChart(labels, datasets) {
        this.createChart('chart-theta', {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Call Theta',
                        data: datasets.callTheta,
                        borderColor: '#00E676',
                        backgroundColor: 'rgba(0, 230, 118, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Put Theta',
                        data: datasets.putTheta,
                        borderColor: '#FF1744',
                        backgroundColor: 'rgba(255, 23, 68, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: this.getCommonChartOptions('Theta Decay', 'Theta ($)')
        });
    },
    
    /**
     * Получение общих настроек графиков
     */
    getCommonChartOptions(title, yAxisTitle) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#ccc',
                        font: { size: 12 },
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(10, 10, 10, 0.95)',
                    titleColor: '#FFD700',
                    bodyColor: '#fff',
                    borderColor: '#333',
                    borderWidth: 1,
                    titleFont: { size: 13, weight: '700' },
                    bodyFont: { size: 12, weight: '500' },
                    padding: 12
                },
                title: {
                    display: true,
                    text: title,
                    color: '#fff',
                    font: { size: 16, weight: '700' }
                }
            },
            scales: {
                x: this.getCommonXAxisOptions(),
                y: {
                    ...this.getCommonYAxisOptions(),
                    title: {
                        display: true,
                        text: yAxisTitle,
                        color: '#888'
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeOutQuart'
            }
        };
    },
    
    /**
     * Получение общих настроек оси X
     */
    getCommonXAxisOptions() {
        return {
            ticks: {
                color: '#888',
                font: { size: 11, weight: '600' },
                maxTicksLimit: 15
            },
            grid: {
                color: 'rgba(51, 51, 51, 0.5)',
                drawBorder: false
            },
            title: {
                display: true,
                text: 'Strike Price',
                color: '#888',
                font: { size: 12, weight: '600' }
            }
        };
    },
    
    /**
     * Получение общих настроек оси Y
     */
    getCommonYAxisOptions() {
        return {
            ticks: {
                color: '#888',
                font: { size: 11, weight: '600' }
            },
            grid: {
                color: 'rgba(51, 51, 51, 0.5)',
                drawBorder: false
            },
            beginAtZero: true
        };
    },
    
    /**
     * Показать сообщение об отсутствии данных на графиках
     */
    showNoDataOnCharts() {
        const chartIds = [
            'chart-oi', 'chart-vol', 'chart-iv', 'chart-mp',
            'chart-gamma', 'chart-delta', 'chart-gex', 'chart-theta'
        ];
        
        chartIds.forEach(chartId => {
            const container = document.getElementById(chartId)?.parentElement;
            if (container) {
                container.innerHTML = `
                    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: #888; font-size: 1.1rem; text-align: center; padding: 40px;">
                        <div style="font-size: 3rem; margin-bottom: 20px;">📊</div>
                        <div style="font-weight: 600; margin-bottom: 10px;">Insufficient Data</div>
                        <div style="font-size: 0.9rem;">Not enough strike prices available for chart rendering</div>
                    </div>
                `;
            }
        });
    }
};

// Экспорт в глобальную область видимости
window.ChartsModule = ChartsModule;
