import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { dbService } from '../services/dbService';
import { nutritionEngine } from '../services/nutritionEngine';
import { Loader2, Plus, Save, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

const FoodInput = () => {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await aiService.parseFood(input);
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const log = await dbService.getDailyLog(today);

            const newEntry = {
                ...result,
                item_name: input, // Simplified, maybe extract from AI later
                timestamp: new Date().toISOString()
            };

            log.entries.push(newEntry);

            // Update totals
            log.totals = nutritionEngine.calculateDailyTotals(log.entries);

            await dbService.saveDailyLog(log);
            navigate('/');
        } catch (err) {
            setError("Failed to save entry: " + err.message);
        }
    };

    return (
        <div className="pb-20 pt-4">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Log Food</h1>
                <p className="text-sm text-gray-400">Describe what you ate</p>
            </header>

            <div className="card mb-4 relative">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. 200g chicken breast and 1 cup rice"
                    className="w-full bg-transparent border-none text-white placeholder-zinc-600 focus:ring-0 resize-none h-32 text-lg"
                    autoFocus
                />
                <div className="absolute bottom-4 right-4 text-xs text-zinc-600">
                    {input.length} chars
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-4 text-sm flex items-start gap-3">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className="card bg-zinc-800/50 border-lime-500/20 mb-4 animate-fade-in">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="mt-1 text-lime-400">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Analysis Result</h3>
                            <p className="text-xs text-gray-400">Source: {result.source === 'cache' ? 'Local Cache' : 'AI Provider'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                        <ResultMetric label="Cals" value={result.calories} unit="" />
                        <ResultMetric label="Prot" value={result.protein} unit="g" />
                        <ResultMetric label="Carbs" value={result.carbs} unit="g" />
                        <ResultMetric label="Fat" value={result.fat} unit="g" />
                    </div>
                </div>
            )}

            <div className="fixed bottom-24 left-0 right-0 px-4 container">
                {!result ? (
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !input.trim()}
                        className="btn btn-primary h-14 text-lg shadow-lg shadow-lime-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2" size={20} />}
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setResult(null)}
                            className="btn btn-secondary flex-1 h-14"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn btn-primary flex-[2] h-14 shadow-lg shadow-lime-900/20"
                        >
                            <Save className="mr-2" size={20} />
                            Save Entry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ResultMetric = ({ label, value, unit }) => (
    <div className="bg-zinc-950/50 rounded-lg p-2">
        <div className="text-lg font-bold text-white">{Math.round(value)}<span className="text-xs font-normal text-gray-500">{unit}</span></div>
        <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
    </div>
);

export default FoodInput;
