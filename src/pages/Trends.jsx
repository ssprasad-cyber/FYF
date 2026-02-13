import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { dbService } from '../services/dbService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Trends = () => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const dates = [];
        const calories = [];
        const protein = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const log = await dbService.getDailyLog(dateStr);
            dates.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
            calories.push(log.totals?.calories || 0);
            protein.push(log.totals?.protein || 0);
        }

        setChartData({
            labels: dates,
            datasets: [
                {
                    label: 'Calories',
                    data: calories,
                    borderColor: '#a3e635', // Lime 400
                    backgroundColor: 'rgba(163, 230, 53, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Protein (g)',
                    data: protein,
                    borderColor: '#3b82f6', // Blue 500
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    type: 'bar',
                    yAxisID: 'y1'
                }
            ]
        });
        setLoading(false);
    };

    const options = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#a1a1aa'
                }
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: { color: '#71717a' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false,
                },
                ticks: { color: '#71717a' }
            },
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: { color: '#a1a1aa' }
            }
        }
    };

    return (
        <div className="pb-20 pt-4">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Trends</h1>
                <p className="text-sm text-gray-400">Last 7 Days</p>
            </header>

            <div className="card h-80 flex items-center justify-center">
                {loading ? (
                    <div className="text-gray-400">Loading charts...</div>
                ) : (
                    <Line options={options} data={chartData} />
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="card !mb-0 text-center">
                    <h3 className="text-sm text-gray-400">Avg Calories</h3>
                    <p className="text-2xl font-bold mt-1 text-lime-400">
                        {chartData && Math.round(chartData.datasets[0].data.reduce((a, b) => a + b, 0) / 7)}
                    </p>
                </div>
                <div className="card !mb-0 text-center">
                    <h3 className="text-sm text-gray-400">Avg Protein</h3>
                    <p className="text-2xl font-bold mt-1 text-blue-400">
                        {chartData && Math.round(chartData.datasets[1].data.reduce((a, b) => a + b, 0) / 7)}g
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Trends;
