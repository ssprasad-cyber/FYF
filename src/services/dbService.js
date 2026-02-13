import { openDB } from 'idb';
import { normalizeInput } from '../utils/normalize';


const DB_NAME = 'fyf_db';
const DB_VERSION = 1;

let dbPromise;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('user_settings')) {
                    db.createObjectStore('user_settings');
                }

                if (!db.objectStoreNames.contains('daily_logs')) {
                    db.createObjectStore('daily_logs', { keyPath: 'date' });
                }

                if (!db.objectStoreNames.contains('food_cache')) {
                    db.createObjectStore('food_cache', { keyPath: 'normalized_input' });
                }

                if (!db.objectStoreNames.contains('hydration_logs')) {
                    db.createObjectStore('hydration_logs', { keyPath: 'date' });
                }

                if (!db.objectStoreNames.contains('api_usage')) {
                    db.createObjectStore('api_usage', { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
};

export const dbService = {
    // Settings
    async getSettings() {
        const db = await getDB();
        return (await db.get('user_settings', 'config')) || {
            provider: 'gemini',
            apiKey: '',
            dailyLimit: 20,
            warningThreshold: 0.8
        };
    },

    async saveSettings(settings) {
        const db = await getDB();
        return db.put('user_settings', settings, 'config');
    },

    // Daily Logs
    async getDailyLog(date) {
        const db = await getDB();
        return (await db.get('daily_logs', date)) || {
            date,
            entries: [],
            totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        };
    },

    async saveDailyLog(log) {
        const db = await getDB();
        return db.put('daily_logs', log);
    },

    // Food Cache
    async getCachedFood(input) {
        const db = await getDB();
        const normalized = normalizeInput(input);
        return db.get('food_cache', normalized);
    },

    async cacheFood(input, nutrition) {
        const db = await getDB();
        const normalized = normalizeInput(input);
        return db.put('food_cache', { normalized_input: normalized, nutrition });
    },

    // Hydration
    async getHydration(date) {
        const db = await getDB();
        return (await db.get('hydration_logs', date)) || { date, water_ml: 0 };
    },

    async updateHydration(date, amount) {
        const db = await getDB();
        const current = await this.getHydration(date);
        current.water_ml += amount;
        return db.put('hydration_logs', current);
    },

    // API Usage
    async getUsage(date, provider = 'gemini') {
        const db = await getDB();
        const id = `${date}_${provider}`;
        return (await db.get('api_usage', id)) || { id, date, provider, requests: 0 };
    },

    async incrementUsage(date, provider = 'gemini') {
        const db = await getDB();
        const current = await this.getUsage(date, provider);
        current.requests += 1;
        return db.put('api_usage', current);
    },

    // Backup
    async exportData() {
        const db = await getDB();
        const stores = ['user_settings', 'daily_logs', 'food_cache', 'hydration_logs', 'api_usage'];
        const data = {};

        for (const storeName of stores) {
            data[storeName] = await db.getAll(storeName);
        }

        return JSON.stringify(data, null, 2);

    },

    async importData(jsonString) {
        const data = JSON.parse(jsonString);
        const db = await getDB();

        const stores = ['user_settings', 'daily_logs', 'food_cache', 'hydration_logs', 'api_usage'];

        const tx = db.transaction(stores, 'readwrite');

        try {
            for (const storeName of stores) {
                if (data[storeName]) {
                    const store = tx.objectStore(storeName);

                    await store.clear();

                    for (const item of data[storeName]) {
                        await store.put(item);
                    }
                }
            }

            await tx.done;
        } catch (e) {
            tx.abort();
            throw e;
        }
    }
};
