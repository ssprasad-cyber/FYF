import React, { useState, useEffect, useMemo } from 'react';
import { 
  Droplet, 
  Flame, 
  Zap, 
  Activity, 
  ChevronRight, 
  Plus, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  Utensils, 
  LayoutGrid, 
  PieChart, 
  Search, 
  Home,
  X
} from 'lucide-react';

/**
 * UTILS & DATABASE INITIALIZATION
 * Using native IndexedDB wrapper to ensure zero-dependency compatibility
 */

const normalizeInput = (input) => input.trim().toLowerCase();

const DB_NAME = 'fyf_db';
const DB_VERSION = 1;

// Simple native wrapper for IndexedDB to replace external 'idb' dependency
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('user_settings')) db.createObjectStore('user_settings');
      if (!db.objectStoreNames.contains('daily_logs')) db.createObjectStore('daily_logs', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('food_cache')) db.createObjectStore('food_cache', { keyPath: 'normalized_input' });
      if (!db.objectStoreNames.contains('hydration_logs')) db.createObjectStore('hydration_logs', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('api_usage')) db.createObjectStore('api_usage', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const dbService = {
  async getSettings() {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction('user_settings', 'readonly');
      const store = transaction.objectStore('user_settings');
      const request = store.get('config');
      request.onsuccess = () => resolve(request.result || { 
        provider: 'gemini', 
        apiKey: '', 
        dailyLimit: 20, 
        warningThreshold: 0.8,
        profile: { goal: 'maintenance' } 
      });
    });
  },

  async saveSettings(settings) {
    const db = await openDatabase();
    const transaction = db.transaction('user_settings', 'readwrite');
    transaction.objectStore('user_settings').put(settings, 'config');
  },

  async getDailyLog(date) {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction('daily_logs', 'readonly');
      const store = transaction.objectStore('daily_logs');
      const request = store.get(date);
      request.onsuccess = () => resolve(request.result || {
        date,
        entries: [],
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      });
    });
  },

  async saveDailyLog(log) {
    const db = await openDatabase();
    const transaction = db.transaction('daily_logs', 'readwrite');
    transaction.objectStore('daily_logs').put(log);
  },

  async getHydration(date) {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction('hydration_logs', 'readonly');
      const store = transaction.objectStore('hydration_logs');
      const request = store.get(date);
      request.onsuccess = () => resolve(request.result || { date, water_ml: 0 });
    });
  },

  async updateHydration(date, amount) {
    const db = await openDatabase();
    const current = await this.getHydration(date);
    current.water_ml += amount;
    const transaction = db.transaction('hydration_logs', 'readwrite');
    transaction.objectStore('hydration_logs').put(current);
    return current;
  }
};

/**
 * CALCULATION ENGINES
 */
const goalEngine = {
  calculateTargets: (profile) => {
    if (profile?.goal === 'weight_loss') return { calories: 1800, protein: 160, carbs: 150, fat: 60 };
    if (profile?.goal === 'muscle_gain') return { calories: 2800, protein: 200, carbs: 300, fat: 70 };
    return { calories: 2000, protein: 150, carbs: 200, fat: 60 };
  }
};

const nutritionEngine = {
  calculateRemaining: (totals, targets) => ({
    calories: targets.calories - totals.calories,
    protein: targets.protein - totals.protein,
    carbs: targets.carbs - totals.carbs,
    fat: targets.fat - totals.fat
  })
};

/**
 * UI COMPONENTS
 */
const GlassCard = ({ children, className = "" }) => (
  <div className={`rounded-[2.5rem] p-6 border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl relative overflow-hidden ${className}`}>
    {children}
  </div>
);

const App = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyLog, setDailyLog] = useState(null);
    const [hydration, setHydration] = useState(0);
    const [targets, setTargets] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 60 });
    const [goals, setGoals] = useState({ goal: 'maintenance' });
    const [showValues, setShowValues] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [heatmapData, setHeatmapData] = useState([]);

    // Load main dashboard data
    const loadData = async () => {
        const log = await dbService.getDailyLog(date);
        const hydro = await dbService.getHydration(date);
        const settings = await dbService.getSettings();

        const calculatedTargets = goalEngine.calculateTargets(settings.profile || {});

        setDailyLog(log);
        setHydration(hydro.water_ml);
        setTargets(calculatedTargets);
        setGoals(settings.profile || { goal: 'maintenance' });
    };

    useEffect(() => {
        loadData();
    }, [date]);

    // Consistency Heatmap Logic
    useEffect(() => {
        const generateHeatmap = async () => {
            const data = [];
            for (let i = 90; i >= 0; i--) {
                const pastDate = new Date(date);
                pastDate.setDate(pastDate.getDate() - i);
                const log = await dbService.getDailyLog(pastDate.toISOString().split('T')[0]);
                const intensity = log?.totals?.calories ? Math.min(4, Math.floor((log.totals.calories / targets.calories) * 4)) : 0;
                data.push({ date: pastDate.toISOString().split('T')[0], intensity });
            }
            setHeatmapData(data);
        };
        generateHeatmap();
    }, [date, targets.calories]);

    const addHydration = async (amount) => {
        const hydroUpdate = await dbService.updateHydration(date, amount);
        setHydration(hydroUpdate.water_ml);
    };

    if (!dailyLog) return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-rose-400 font-black tracking-widest">SYNCING PORTAL...</div>
      </div>
    );

    const totals = dailyLog.totals;
    const remaining = nutritionEngine.calculateRemaining(totals, targets);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-rose-500/30 overflow-x-hidden pb-32">
            
            {/* Background Mesh Gradients */}
            <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 p-6 flex justify-between items-center max-w-md mx-auto">
                <div>
                    <h2 className="text-white/40 text-[10px] font-black uppercase tracking-widest">Macro Portal</h2>
                    <h1 className="text-2xl font-black tracking-tight mt-0.5">Hello, Prasad</h1>
                </div>
                <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                    <span className="text-[10px] font-bold text-rose-200 uppercase tracking-tighter">Premium</span>
                </div>
            </header>

            <main className="relative z-10 px-6 max-w-md mx-auto space-y-6">
                
                {/* Main Balance Card */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-rose-500/20 blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity" />
                    <GlassCard className="border-white/20">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-400/30 rounded-full blur-[50px]" />
                        
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <span className="text-white/50 text-sm font-medium">Calories Remaining</span>
                            <button onClick={() => setShowValues(!showValues)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <div className="flex items-baseline gap-2 mb-8 relative z-10">
                            <span className="text-3xl font-light text-white/30">₹</span>
                            <h2 className="text-5xl font-black tracking-tighter">
                                {showValues ? Math.round(remaining.calories).toLocaleString() : "••••"}
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1 text-center">Consumed</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-xl font-bold">{Math.round(totals.calories)}</span>
                                    <TrendingUp size={12} className="text-rose-400" />
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1 text-center">Hydration</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-xl font-bold">{hydration}ml</span>
                                    <Droplet size={12} className="text-blue-400" />
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Nutrition Overview */}
                <div className="flex justify-between items-center mb-2 px-1">
                    <h3 className="text-lg font-black tracking-tight">Nutrition Overview</h3>
                    <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-rose-500" />
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
                    <MacroPill label="Protein" current={totals.protein} target={targets.protein} color="rose" icon={Flame} />
                    <MacroPill label="Carbs" current={totals.carbs} target={targets.carbs} color="amber" icon={Zap} />
                    <MacroPill label="Fat" current={totals.fat} target={targets.fat} color="blue" icon={Droplet} />
                </div>

                {/* Consistency Heatmap */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-lg font-black tracking-tight">Consistency Stack</h3>
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Last 90 Days</span>
                    </div>
                    <GlassCard className="p-5 bg-white/[0.01]">
                        <div className="flex flex-wrap gap-1 justify-center">
                            {heatmapData.map((day, i) => (
                                <div 
                                    key={i} 
                                    title={day.date}
                                    className={`w-2.5 h-2.5 rounded-sm transition-colors duration-500 ${
                                        day.intensity === 0 ? 'bg-white/5' : 
                                        day.intensity === 1 ? 'bg-rose-900/40' :
                                        day.intensity === 2 ? 'bg-rose-700/60' :
                                        day.intensity === 3 ? 'bg-rose-500/80' : 'bg-rose-400 shadow-[0_0_5px_#f43f5e]'
                                    }`}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-4 text-[9px] font-black text-white/20 uppercase tracking-widest px-2">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-sm bg-white/5" />
                                <div className="w-2 h-2 rounded-sm bg-rose-900/40" />
                                <div className="w-2 h-2 rounded-sm bg-rose-400" />
                            </div>
                            <span>Most</span>
                        </div>
                    </GlassCard>
                </div>

                {/* Track Analysis Graph */}
                <div className="space-y-4">
                    <h3 className="text-lg font-black tracking-tight px-1">Track Analysis</h3>
                    <GlassCard className="p-6 bg-white/[0.01]">
                        <div className="h-32 flex items-end justify-between gap-2 px-2">
                            {[40, 65, 85, 30, 95, 70, 50].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div 
                                        className="w-full bg-gradient-to-t from-rose-500/20 to-rose-400 rounded-t-lg transition-all duration-700" 
                                        style={{ height: `${h}%` }}
                                    />
                                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-tighter">D{i+1}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Recent Entries Timeline */}
                <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-lg font-black tracking-tight">Recent Entries</h3>
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">History</span>
                    </div>
                    {dailyLog.entries.length === 0 ? (
                        <div className="py-10 text-center border border-dashed border-white/10 rounded-3xl text-white/20 italic">
                            No food logged today
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dailyLog.entries.slice().reverse().map((entry, idx) => (
                                <div key={idx} className="bg-white/[0.03] p-4 rounded-3xl border border-white/5 flex items-center justify-between group active:scale-95 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-rose-400 border border-white/10">
                                            <Utensils size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold capitalize">{entry.item_name || 'Food Item'}</h4>
                                            <div className="flex gap-2 text-[10px] font-bold text-white/20 uppercase mt-0.5">
                                                <span>{Math.round(entry.protein)}p</span>
                                                <span>{Math.round(entry.carbs)}c</span>
                                                <span>{Math.round(entry.fat)}f</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-rose-400 tracking-tighter">+{Math.round(entry.calories)}</p>
                                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">kcal</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-2">
                <div className="max-w-md mx-auto h-20 bg-white/[0.04] backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl flex items-center justify-between px-6">
                    <div className="flex gap-4 sm:gap-6 items-center">
                        <NavBtn icon={Home} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                        <NavBtn icon={LayoutGrid} label="Diary" active={activeTab === 'diary'} onClick={() => setActiveTab('diary')} />
                        <NavBtn icon={PieChart} label="Stats" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                        <NavBtn icon={Search} label="Search" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
                    </div>
                    <div className="flex items-center">
                        <button 
                            onClick={() => addHydration(250)}
                            className="w-14 h-14 bg-[#f8a5ac] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border-4 border-[#0a0a0a]"
                            title="Add 250ml Water"
                        >
                            <Plus size={28} className="text-black stroke-[3px]" />
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    );
};

const MacroPill = ({ label, current, target, color, icon: Icon }) => {
    const percent = Math.min(100, (current / target) * 100);
    const themes = {
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    };
    
    return (
        <div className="min-w-[140px] rounded-[2.5rem] p-5 border border-white/10 bg-white/[0.03] backdrop-blur-xl flex flex-col gap-4 group hover:bg-white/5 transition-colors">
            <div className={`p-2.5 w-fit rounded-2xl border ${themes[color]}`}>
                <Icon size={20} />
            </div>
            <div>
                <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-black tracking-tighter">{Math.round(current)}</p>
                    <span className="text-[10px] font-bold text-white/20 uppercase">/{target}g</span>
                </div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">{label}</p>
                <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${color === 'rose' ? 'bg-rose-500' : color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`} 
                        style={{ width: `${percent}%` }} 
                    />
                </div>
            </div>
        </div>
    );
};

const NavBtn = ({ icon: Icon, active, onClick, label }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
        <Icon size={22} className={`transition-all duration-300 ${active ? 'text-rose-400 scale-110' : 'text-white/30 group-hover:text-white/50'}`} />
        <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${active ? 'text-rose-400' : 'text-white/20'}`}>{label}</span>
    </button>
);

// export default App;