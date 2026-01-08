// ============================================
// 📈 МОДУЛЬ ГРАФИКОВ
// ============================================

const ChartsModule = {
    charts: {},
    chartOptions: {
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
            }
        },
        scales: {
            x: { 
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
            },
            y: { 
                ticks: { 
                    color: '#888', 
                    font: { size: 11, weight: '600' }
                }, 
                grid: { 
                    color: 'rgba(51, 51, 51, 0.5)',
                    drawBorder: false
                },
                beginAtZero: true
            }
        },
        animation: {
            duration: 750,
            easing: 'easeOutQuart'
        }
    },
    
    /**
     * Создание графика
     * @param {string} id - ID canvas элемента
     * @param {Object} config - Конфигурация графика
     */
    createChart(id, config) {
        const ctx = document.getElementById(id);
        if (!ctx) return;
        
        // Удаляем старый график, если есть
        if (this.charts[id]) {
            this.charts[id].destroy();
        }
        
        try {
            // Объединяем с общими настройками
            const mergedConfig = {
                ...config,
                options: {
                    ...this.chartOptions,
                    ...config.options
                }
            };
            
            this.charts[id] = new Chart(ctx, mergedConfig);
        } catch (error) {
            console.error(`❌ Ошибка создания графика ${id}:`, error);
        }
    },
    
    /**
     * Создание всех графиков
     * @param {Array} records - Данные опционной цепи
     */
    createAllCharts(records) {
        if (!records || records.length < 5) {
            this.showNoDataOnCharts();
            return;
        }
        
        const sorted = [...records].sort((a,b) => parseFloat(a.s) - parseFloat(b.s));
        const filtered = sorted;
        
        if (filtered.length < 5) {
            this.showNoDataOnCharts();
            return;
        }
        
        const labels = filtered.map(r => parseFloat(r.s).toFixed(0));
        const strikes = filtered.map(r => parseFloat(r.s));
        
        const datasets = this.calculateDatasets(filtered, strikes);
        const losses = this.calculateMaxPainLosses(filtered, strikes);
        
        // OI Distribution Chart
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
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Put OI',
                        data: datasets.putOI.map(v => -v),
                        backgroundColor: 'rgba(255, 23, 68, 0.7)',
                        borderColor: '#FF1744',
                        borderWidth: 1,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Open Interest Distribution',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Open Interest',
                            color: '#888'
                        }
                    }
                }
            }
        });
        
        // Volume Heatmap Chart
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
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Volume Heatmap',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                }
            }
        });
        
        // IV Smile Chart
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
                        pointRadius: 3,
                        pointBackgroundColor: '#00E676'
                    },
                    {
                        label: 'Put IV',
                        data: datasets.putIV,
                        borderColor: '#FF1744',
                        backgroundColor: 'rgba(255, 23, 68, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#FF1744'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'IV Smile Curve',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                }
            }
        });
        
        // Max Pain Chart
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
                        pointRadius: 4,
                        pointBackgroundColor: '#FFD700'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Max Pain Curve',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                }
            }
        });
        
        // Gamma Exposure Chart
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
                        pointRadius: 3,
                        pointBackgroundColor: '#9C27B0'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Gamma Exposure',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                }
            }
        });
        
        // Delta Profile Chart
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
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Delta Profile',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                }
            }
        });
        
        // GEX Profile Chart
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
                        pointRadius: 3,
                        pointBackgroundColor: '#2196F3'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'GEX Profile',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                },
                scales: {
                    y: {
                        ticks: { 
                            callback: function(value) { 
                                return value.toFixed(1) + 'M'; 
                            } 
                        }
                    }
                }
            }
        });
        
        // Theta Decay Chart
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
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Theta Decay',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                }
            }
        });
    },
    
    /**
     * Расчёт датасетов для графиков
     */
    calculateDatasets(records, strikes) {
        return {
            callOI: records.map(r => r.c?.oi || 0),
            putOI: records.map(r => r.p?.oi || 0),
            callVol: records.map(r => r.c?.vol || 0),
            putVol: records.map(r => r.p?.vol || 0),
            callIV: records.map(r => r.c?.iv || 0),
            putIV: records.map(r => r.p?.iv || 0),
            callDelta: records.map(r => (r.c?.d || 0) * (r.c?.oi || 0) / 100),
            putDelta: records.map(r => (r.p?.d || 0) * (r.p?.oi || 0) / 100),
            callTheta: records.map(r => r.c?.t || 0),
            putTheta: records.map(r => r.p?.t || 0),
            netGamma: records.map(r => {
                const callGamma = (r.c?.g || 0) * (r.c?.oi || 0);
                const putGamma = (r.p?.g || 0) * (r.p?.oi || 0);
                return callGamma - putGamma;
            }),
            netGEX: records.map(r => {
                const strike = parseFloat(r.s);
                const callGEX = (r.c?.oi || 0) * (r.c?.g || 0) * strike * 100;
                const putGEX = (r.p?.oi || 0) * (r.p?.g || 0) * strike * 100;
                return (callGEX - putGEX) / 1000000;
            })
        };
    },
    
    /**
     * Расчёт потерь для Max Pain
     */
    calculateMaxPainLosses(records, strikes) {
        return strikes.map(k => {
            let loss = 0;
            records.forEach(rec => {
                const s = parseFloat(rec.s);
                if (k < s) loss += (s - k) * (rec.c?.oi || 0);
                if (k > s) loss += (k - s) * (rec.p?.oi || 0);
            });
            return loss;
        });
    },
    
    /**
     * Показ сообщения об отсутствии данных
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
    },
    
    /**
     * Очистка всех графиков
     */
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartsModule;
} else {
    window.ChartsModule = ChartsModule;
}
