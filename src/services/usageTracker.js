import { dbService } from './dbService';

export const usageTracker = {
    async getStatus() {
        const today = new Date().toISOString().split('T')[0];
        const settings = await dbService.getSettings();
        const usage = await dbService.getUsage(today);

        const limit = settings.dailyLimit || 50;
        const current = usage ? usage.requests : 0;
        const ratio = current / limit;

        let warningLevel = 'none'; // none, warning, critical
        if (ratio >= 0.95) warningLevel = 'critical';
        else if (ratio >= 0.8) warningLevel = 'warning';

        return {
            allowed: current < limit,
            warningLevel,
            current,
            limit
        };
    },

    async trackRequest() {
        const today = new Date().toISOString().split('T')[0];

        // Ensure usage record exists
        let usage = await dbService.getUsage(today);
        if (!usage) {
            // If getUsage returns null/undefined (though dbService returns default object, let's be safe)
            // dbService.getUsage returns { date, requests: 0 } if not found, so we are good.
            // But wait, in dbService.js:
            // return (await db.get('api_usage', date)) || { date, requests: 0 };
            // So it always returns an object.
        }

        await dbService.incrementUsage(today);
    }
};
