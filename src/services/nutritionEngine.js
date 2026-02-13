export const nutritionEngine = {
    calculateDailyTotals(entries) {
        if (!entries || !Array.isArray(entries)) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };

        return entries.reduce((acc, entry) => {
            // Ensure values are numbers
            acc.calories += Number(entry.calories) || 0;
            acc.protein += Number(entry.protein) || 0;
            acc.carbs += Number(entry.carbs) || 0;
            acc.fat += Number(entry.fat) || 0;
            acc.fiber += Number(entry.fiber) || 0;
            acc.sugar += Number(entry.sugar) || 0;
            acc.sodium += Number(entry.sodium) || 0;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });
    },

    calculateRemaining(totals, targets) {
        if (!totals || !targets) return null
        return {
            calories: Math.max(0, targets.calories - totals.calories),
            protein: Math.max(0, targets.protein - totals.protein),
            carbs: Math.max(0, targets.carbs - totals.carbs),
            fat: Math.max(0, targets.fat - totals.fat),
            
            fiber: Math.max(0, (targets.fiber || 0) - (totals.fiber || 0)),

            sugar: Math.max(0, (targets.sugar || 0) - (totals.sugar || 0)),
            sodium: Math.max(0, (targets.sodium || 0) - (totals.sodium || 0)),
        };
    }
};

export const goalEngine = {
    // Constants
    ACTIVITY_LEVELS: {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        athlete: 1.9
    },

    calculateTargets(profile) {
        // Basic BMR (Mifflin-St Jeor)
        // Default values if profile incomplete
        const weight = Number(profile.weight) || 70; // kg
        const height = Number(profile.height) || 175; // cm
        const age = Number(profile.age) || 25;
        const gender = profile.gender || 'male';
        const activityLevel = this.ACTIVITY_LEVELS[profile.activityLevel] || 1.375;
        const goal = profile.goal || 'maintenance'; // cut, maintenance, bulk

        let bmr = (10 * weight) + (6.25 * height) - (5 * age);

        if (gender === 'male') bmr += 5;
        else if (gender === 'female') bmr -= 161;
        else bmr += 5; // default to male formula or neutral

        // TDEE
        const tdee = bmr * activityLevel;

        // Goal Adjustment
        let targetCalories = tdee;
        if (goal === 'cut') targetCalories -= 500;
        else if (goal === 'bulk') targetCalories += 300;

        // Macros (Protein heavy for FYF)
        // 2.2g per kg of bodyweight
        const protein = weight * 2.2;

        // Remaining calories for fats and carbs
        const proteinCals = protein * 4;
        const remainingCals = Math.max(0, targetCalories - proteinCals);

        // Split remaining: 30% Fat, 70% Carbs (or standard split)
        // Let's go with 0.8g fat per kg min, rest carbs.
        let fat = weight * 0.8;
        let fatCals = fat * 9;

        if (fatCals > remainingCals) {
            // adjust if protein took too much
            fat = (remainingCals * 0.3) / 9;
        }

        
        const carbsCals = Math.max(0, targetCalories - proteinCals - fatCals);
        const carbs = carbsCals / 4;

        return {
            calories: Math.round(targetCalories),
            protein: Math.round(protein),
            fat: Math.round(fat),
            carbs: Math.round(carbs)
        };
    }
};
