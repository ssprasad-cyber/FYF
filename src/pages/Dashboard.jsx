import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { goalEngine, nutritionEngine } from '../services/nutritionEngine';
import { Droplet, Flame, Zap, Activity, ChevronRight } from 'lucide-react';

const Dashboard = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyLog, setDailyLog] = useState(null);
    const [hydration, setHydration] = useState(0);
    const [targets, setTargets] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 60 });
    const [goals, setGoals] = useState({ goal: 'maintenance' });

    useEffect(() => {
        loadData();
    }, [date]);

    const loadData = async () => {
        const log = await dbService.getDailyLog(date);
        const hydro = await dbService.getHydration(date);
        const settings = await dbService.getSettings();

        // In a real app, user profile would be in settings, for now using defaults or calculated
        // We should probably add profile fields to settings page to make this dynamic
        // using default profile for calculation for now
        const calculatedTargets = goalEngine.calculateTargets(settings.profile || {});

        setDailyLog(log);
        setHydration(hydro.water_ml);
        setTargets(calculatedTargets);
        setGoals(settings.profile || { goal: 'maintenance' });
    };

    const addHydration = async (amount) => {
        const newAmount = hydration + amount;
        setHydration(newAmount);
        await dbService.updateHydration(date, newAmount);
    };

    if (!dailyLog) return <div className="p-4 text-center">Loading...</div>;

    const totals = dailyLog.totals;
    const remaining = nutritionEngine.calculateRemaining(totals, targets);

    return (
        <div className="pb-20">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Today</h1>
                    <p className="text-sm text-gray-400">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="h-10 w-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                    {/* Profile Icon Placeholder */}
                    <Activity size={20} className="text-lime-400" />
                </div>
            </header>

            {/* Main Calories Card */}
            <div className="card bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Flame size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-sm text-gray-400 block mb-1">Calories Remaining</span>
                            <span className="text-4xl font-bold text-white">{Math.round(remaining.calories)}</span>
                            <span className="text-sm text-gray-500 ml-2">/ {targets.calories}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs px-2 py-1 rounded bg-zinc-700 text-lime-400 uppercase font-bold tracking-wider">{goals.goal || 'MAINTENANCE'}</span>
                        </div>
                    </div>

                    <div className="progress-track bg-zinc-950/50 h-3 mt-4">
                        <div
                            className="progress-fill bg-lime-400"
                            style={{ width: `${Math.min(100, (totals.calories / targets.calories) * 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <MacroCard
                    label="Protein"
                    current={totals.protein}
                    target={targets.protein}
                    color="bg-blue-500"
                    unit="g"
                />
                <MacroCard
                    label="Carbs"
                    current={totals.carbs}
                    target={targets.carbs}
                    color="bg-amber-500"
                    unit="g"
                />
                <MacroCard
                    label="Fat"
                    current={totals.fat}
                    target={targets.fat}
                    color="bg-rose-500"
                    unit="g"
                />
            </div>

            {/* Hydration */}
            <div className="card flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Droplet size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold">Hydration</h3>
                        <p className="text-sm text-gray-400">{hydration} / 3000 ml</p>
                    </div>
                </div>
                <button
                    onClick={() => addHydration(250)}
                    className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all"
                >
                    +
                </button>
            </div>

            {/* Recent Entries */}
            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Recent Entries</h3>
                    {dailyLog.entries.length > 0 && <span className="text-xs text-gray-500">{dailyLog.entries.length} items</span>}
                </div>

                {dailyLog.entries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border border-dashed border-zinc-800 rounded-xl">
                        No food logged today
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dailyLog.entries.slice().reverse().map((entry, idx) => (
                            <div key={idx} className="card p-3 flex justify-between items-center !mb-0 active:scale-[0.99] transition-transform">
                                <div>
                                    <h4 className="font-medium capitalize">{entry.item_name || 'Food Item'}</h4>
                                    <div className="flex gap-3 text-xs text-gray-400 mt-1">
                                        <span>{Math.round(entry.calories)} kcal</span>
                                        <span>{Math.round(entry.protein)}p</span>
                                        <span>{Math.round(entry.carbs)}c</span>
                                        <span>{Math.round(entry.fat)}f</span>
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-600">
                                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

const MacroCard = ({ label, current, target, color, unit }) => {
    const percent = Math.min(100, (current / target) * 100);
    return (
        <div className="card !p-3 flex flex-col justify-between !mb-0 aspect-square">
            <span className="text-xs text-gray-400">{label}</span>
            <div>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white">{Math.round(current)}</span>
                    <span className="text-xs text-gray-500">/{target}{unit}</span>
                </div>
                <div className="progress-track h-1.5 mt-2 bg-zinc-950">
                    <div className={`progress-fill ${color}`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
