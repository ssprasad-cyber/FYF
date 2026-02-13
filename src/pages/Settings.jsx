import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Save, Download, Upload, Trash2, Key, User } from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState({
        provider: 'gemini',
        apiKey: '',
        dailyLimit: 50,
        warningThreshold: 0.8,
        profile: {
            weight: 70,
            height: 175,
            age: 25,
            gender: 'male',
            activityLevel: 'moderate',
            goal: 'maintenance'
        }
    });

    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const data = await dbService.getSettings();
        if (data) {
            // Merge with defaults to ensure all fields exist if schema updates
            setSettings(prev => ({
                ...prev,
                ...data,
                profile: { ...prev.profile, ...(data.profile || {}) }
            }));
        }
    };

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleProfileChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            profile: { ...prev.profile, [field]: value }
        }));
    };

    const handleSave = async () => {
        await dbService.saveSettings(settings);
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleBackup = async () => {
        const json = await dbService.exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fyf_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleRestore = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                await dbService.importData(event.target.result);
                setMessage('Data restored successfully!');
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                setMessage('Failed to restore data.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="pb-20 pt-4">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-gray-400">Configure your experience</p>
            </header>

            {message && (
                <div className="bg-lime-500/10 border border-lime-500/20 text-lime-400 p-3 rounded-lg mb-4 text-sm text-center">
                    {message}
                </div>
            )}

            {/* API Settings */}
            <section className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Key size={14} /> AI Configuration
                </h3>
                <div className="card space-y-4">
                    <div>
                        <label className="label">Provider</label>
                        <select
                            className="input"
                            value={settings.provider}
                            onChange={(e) => handleChange('provider', e.target.value)}
                        >
                            <option value="gemini">Google Gemini</option>
                            <option value="groq" disabled>Groq (Coming Soon)</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">API Key</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="Enter your API Key"
                            value={settings.apiKey}
                            onChange={(e) => handleChange('apiKey', e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Keys are stored locally on your device.</p>
                    </div>
                    <div>
                        <label className="label">Daily Request Limit</label>
                        <input
                            type="number"
                            className="input"
                            value={settings.dailyLimit}
                            onChange={(e) => handleChange('dailyLimit', Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="label">Warning Threshold</label>
                        <input
                            type="number"
                            className="input"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.warningThreshold}
                            onChange={(e) => handleChange('warningThreshold', Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">Alert when usage reaches this percentage of daily limit.</p>
                    </div>
                    <button onClick={handleSave} className="btn btn-accent w-full mt-2">
                        <Save size={18} className="mr-2" />
                        Save Model Settings
                    </button>
                </div>
            </section>

            {/* Profile Settings */}
            <section className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User size={14} /> Body Profile
                </h3>
                <div className="card space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Weight (kg)</label>
                            <input
                                type="number"
                                className="input"
                                value={settings.profile.weight}
                                onChange={(e) => handleProfileChange('weight', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="label">Height (cm)</label>
                            <input
                                type="number"
                                className="input"
                                value={settings.profile.height}
                                onChange={(e) => handleProfileChange('height', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Age</label>
                            <input
                                type="number"
                                className="input"
                                value={settings.profile.age}
                                onChange={(e) => handleProfileChange('age', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="label">Gender</label>
                            <select
                                className="input"
                                value={settings.profile.gender}
                                onChange={(e) => handleProfileChange('gender', e.target.value)}
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label">Goal</label>
                        <select
                            className="input"
                            value={settings.profile.goal}
                            onChange={(e) => handleProfileChange('goal', e.target.value)}
                        >
                            <option value="cut">Fat Loss (Cut)</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="bulk">Muscle Gain (Bulk)</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Actions */}
            <div className="space-y-3">
                <button onClick={handleSave} className="btn btn-primary">
                    <Save size={18} className="mr-2" />
                    Save Changes
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleBackup} className="btn btn-secondary">
                        <Download size={18} className="mr-2" />
                        Backup Data
                    </button>
                    <label className="btn btn-secondary cursor-pointer">
                        <Upload size={18} className="mr-2" />
                        Restore Data
                        <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                    </label>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-xs text-zinc-700">FYF v1.0.0 &bull; Offline First</p>
            </div>
        </div>
    );
};

export default Settings;
