/**
 * Smart Meal Planner Service for Diabetics
 * Regional Indian foods with cost awareness
 */

export type IndianRegion = 
  | 'north' 
  | 'south' 
  | 'east' 
  | 'west' 
  | 'central' 
  | 'northeast'
  | 'rajasthan'
  | 'mp-chhattisgarh'
  | 'punjab-haryana'
  | 'all';

export interface MealItem {
  id: string;
  name: string;
  nameHindi?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  region: IndianRegion[];
  glycemicIndex: number; // 0-100
  carbs: number; // grams per serving
  protein: number; // grams per serving
  fiber: number; // grams per serving
  calories: number; // per serving
  cost: number; // INR per serving
  diabeticFriendly: boolean;
  servingSize: string;
  alternatives?: string[]; // IDs of cheaper alternatives
  notes?: string;
}

export interface MealPlan {
  date: string;
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snacks: MealItem[];
  totalCost: number;
  totalCarbs: number;
  totalCalories: number;
  diabeticScore: number; // 0-100, higher is better
}

// Indian Regional Food Database
export const MEAL_DATABASE: MealItem[] = [
  // Breakfast Items
  {
    id: 'poha',
    name: 'Poha (Flattened Rice)',
    nameHindi: 'पोहा',
    category: 'breakfast',
    region: ['central', 'mp-chhattisgarh', 'west'],
    glycemicIndex: 70,
    carbs: 45,
    protein: 8,
    fiber: 2,
    calories: 250,
    cost: 20,
    diabeticFriendly: false,
    servingSize: '1 bowl',
    alternatives: ['oats-poha'],
    notes: 'High GI, consume in moderation',
  },
  {
    id: 'oats-poha',
    name: 'Oats Poha',
    nameHindi: 'ओट्स पोहा',
    category: 'breakfast',
    region: ['central', 'mp-chhattisgarh', 'west'],
    glycemicIndex: 55,
    carbs: 35,
    protein: 12,
    fiber: 6,
    calories: 220,
    cost: 25,
    diabeticFriendly: true,
    servingSize: '1 bowl',
    notes: 'Better alternative to regular poha',
  },
  {
    id: 'idli',
    name: 'Idli',
    nameHindi: 'इडली',
    category: 'breakfast',
    region: ['south'],
    glycemicIndex: 75,
    carbs: 30,
    protein: 6,
    fiber: 1,
    calories: 150,
    cost: 30,
    diabeticFriendly: false,
    servingSize: '2 pieces',
    alternatives: ['ragi-idli'],
    notes: 'High GI, pair with protein',
  },
  {
    id: 'ragi-idli',
    name: 'Ragi Idli',
    nameHindi: 'रागी इडली',
    category: 'breakfast',
    region: ['south'],
    glycemicIndex: 55,
    carbs: 25,
    protein: 8,
    fiber: 5,
    calories: 140,
    cost: 35,
    diabeticFriendly: true,
    servingSize: '2 pieces',
    notes: 'Lower GI, more fiber',
  },
  {
    id: 'roti-sabji',
    name: 'Roti with Sabzi',
    nameHindi: 'रोटी सब्जी',
    category: 'breakfast',
    region: ['north', 'rajasthan', 'punjab-haryana'],
    glycemicIndex: 60,
    carbs: 40,
    protein: 10,
    fiber: 4,
    calories: 280,
    cost: 25,
    diabeticFriendly: true,
    servingSize: '2 roti + sabzi',
    notes: 'Whole wheat roti preferred',
  },
  {
    id: 'dal-chawal',
    name: 'Dal Rice',
    nameHindi: 'दाल चावल',
    category: 'breakfast',
    region: ['north', 'east', 'central'],
    glycemicIndex: 70,
    carbs: 50,
    protein: 12,
    fiber: 3,
    calories: 320,
    cost: 30,
    diabeticFriendly: false,
    servingSize: '1 plate',
    alternatives: ['brown-rice-dal'],
    notes: 'High GI, limit portion',
  },
  {
    id: 'brown-rice-dal',
    name: 'Brown Rice Dal',
    nameHindi: 'ब्राउन राइस दाल',
    category: 'breakfast',
    region: ['north', 'east', 'central'],
    glycemicIndex: 55,
    carbs: 45,
    protein: 14,
    fiber: 6,
    calories: 300,
    cost: 35,
    diabeticFriendly: true,
    servingSize: '1 plate',
    notes: 'Better than white rice',
  },
  {
    id: 'bhutta',
    name: 'Roasted Corn',
    nameHindi: 'भुट्टा',
    category: 'snack',
    region: ['north', 'central', 'mp-chhattisgarh'],
    glycemicIndex: 60,
    carbs: 25,
    protein: 4,
    fiber: 3,
    calories: 120,
    cost: 15,
    diabeticFriendly: true,
    servingSize: '1 piece',
    notes: 'Good snack option',
  },
  {
    id: 'roasted-chana',
    name: 'Roasted Chana',
    nameHindi: 'भुना चना',
    category: 'snack',
    region: ['north', 'central', 'west'],
    glycemicIndex: 25,
    carbs: 20,
    protein: 15,
    fiber: 12,
    calories: 180,
    cost: 20,
    diabeticFriendly: true,
    servingSize: '1 bowl',
    notes: 'Excellent protein and fiber',
  },
  {
    id: 'sprouts',
    name: 'Sprouts Salad',
    nameHindi: 'अंकुरित सलाद',
    category: 'snack',
    region: ['all'],
    glycemicIndex: 30,
    carbs: 15,
    protein: 12,
    fiber: 8,
    calories: 120,
    cost: 20,
    diabeticFriendly: true,
    servingSize: '1 bowl',
    notes: 'Very low GI, high protein',
  },
  {
    id: 'muesli',
    name: 'Muesli',
    nameHindi: 'म्यूसली',
    category: 'breakfast',
    region: ['all'],
    glycemicIndex: 65,
    carbs: 50,
    protein: 8,
    fiber: 6,
    calories: 300,
    cost: 120,
    diabeticFriendly: false,
    servingSize: '1 bowl',
    alternatives: ['roasted-chana', 'sprouts'],
    notes: 'Expensive, alternatives available',
  },
  // Lunch Items
  {
    id: 'dal-roti-sabzi',
    name: 'Dal Roti Sabzi',
    nameHindi: 'दाल रोटी सब्जी',
    category: 'lunch',
    region: ['north', 'central', 'rajasthan'],
    glycemicIndex: 55,
    carbs: 50,
    protein: 18,
    fiber: 8,
    calories: 380,
    cost: 40,
    diabeticFriendly: true,
    servingSize: '2 roti + dal + sabzi',
    notes: 'Balanced meal',
  },
  {
    id: 'sambar-rice',
    name: 'Sambar Rice',
    nameHindi: 'सांबर राइस',
    category: 'lunch',
    region: ['south'],
    glycemicIndex: 70,
    carbs: 55,
    protein: 10,
    fiber: 4,
    calories: 350,
    cost: 45,
    diabeticFriendly: false,
    servingSize: '1 plate',
    alternatives: ['sambar-brown-rice'],
    notes: 'Use brown rice',
  },
  {
    id: 'sambar-brown-rice',
    name: 'Sambar Brown Rice',
    nameHindi: 'सांबर ब्राउन राइस',
    category: 'lunch',
    region: ['south'],
    glycemicIndex: 55,
    carbs: 50,
    protein: 12,
    fiber: 7,
    calories: 340,
    cost: 50,
    diabeticFriendly: true,
    servingSize: '1 plate',
    notes: 'Better glycemic control',
  },
  {
    id: 'khichdi',
    name: 'Khichdi',
    nameHindi: 'खिचड़ी',
    category: 'lunch',
    region: ['north', 'west', 'east'],
    glycemicIndex: 65,
    carbs: 45,
    protein: 10,
    fiber: 4,
    calories: 300,
    cost: 35,
    diabeticFriendly: false,
    servingSize: '1 bowl',
    alternatives: ['moong-dal-khichdi'],
    notes: 'Easy to digest',
  },
  {
    id: 'moong-dal-khichdi',
    name: 'Moong Dal Khichdi',
    nameHindi: 'मूंग दाल खिचड़ी',
    category: 'lunch',
    region: ['north', 'west', 'east'],
    glycemicIndex: 50,
    carbs: 40,
    protein: 14,
    fiber: 6,
    calories: 290,
    cost: 40,
    diabeticFriendly: true,
    servingSize: '1 bowl',
    notes: 'Lower GI than regular khichdi',
  },
  // Dinner Items
  {
    id: 'dal-roti-dinner',
    name: 'Dal Roti (Dinner)',
    nameHindi: 'दाल रोटी',
    category: 'dinner',
    region: ['north', 'central'],
    glycemicIndex: 55,
    carbs: 35,
    protein: 15,
    fiber: 6,
    calories: 280,
    cost: 35,
    diabeticFriendly: true,
    servingSize: '1-2 roti + dal',
    notes: 'Light dinner option',
  },
  {
    id: 'vegetable-curry-rice',
    name: 'Vegetable Curry Rice',
    nameHindi: 'सब्जी चावल',
    category: 'dinner',
    region: ['south', 'east'],
    glycemicIndex: 70,
    carbs: 50,
    protein: 8,
    fiber: 3,
    calories: 320,
    cost: 40,
    diabeticFriendly: false,
    servingSize: '1 plate',
    alternatives: ['vegetable-curry-brown-rice'],
    notes: 'Limit rice portion',
  },
  {
    id: 'vegetable-curry-brown-rice',
    name: 'Vegetable Curry Brown Rice',
    nameHindi: 'सब्जी ब्राउन राइस',
    category: 'dinner',
    region: ['south', 'east'],
    glycemicIndex: 55,
    carbs: 45,
    protein: 10,
    fiber: 6,
    calories: 310,
    cost: 45,
    diabeticFriendly: true,
    servingSize: '1 plate',
    notes: 'Better than white rice',
  },
];

/**
 * Get meals for a specific region
 */
export const getMealsForRegion = (region: IndianRegion): MealItem[] => {
  return MEAL_DATABASE.filter(meal => 
    meal.region.includes(region) || meal.region.includes('all')
  );
};

/**
 * Generate personalized meal plan
 */
export const generateMealPlan = (
  region: IndianRegion,
  budgetPerDay: number = 150,
  targetCarbs: number = 150,
  targetCalories: number = 1800,
  days: number = 7
): MealPlan[] => {
  const availableMeals = getMealsForRegion(region);
  const plans: MealPlan[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Filter diabetic-friendly meals
    const diabeticMeals = availableMeals.filter(m => m.diabeticFriendly);
    
    // Select breakfast
    const breakfastOptions = diabeticMeals.filter(m => m.category === 'breakfast');
    const breakfast = breakfastOptions.length > 0 
      ? [breakfastOptions[Math.floor(Math.random() * breakfastOptions.length)]]
      : [];
    
    // Select lunch
    const lunchOptions = diabeticMeals.filter(m => m.category === 'lunch');
    const lunch = lunchOptions.length > 0
      ? [lunchOptions[Math.floor(Math.random() * lunchOptions.length)]]
      : [];
    
    // Select dinner (prefer lighter options)
    const dinnerOptions = diabeticMeals.filter(m => m.category === 'dinner');
    const dinner = dinnerOptions.length > 0
      ? [dinnerOptions[Math.floor(Math.random() * dinnerOptions.length)]]
      : [];
    
    // Select snacks
    const snackOptions = diabeticMeals.filter(m => m.category === 'snack');
    const snacks = snackOptions.length > 0
      ? [snackOptions[Math.floor(Math.random() * snackOptions.length)]]
      : [];
    
    // Calculate totals
    const allMeals = [...breakfast, ...lunch, ...dinner, ...snacks];
    const totalCost = allMeals.reduce((sum, meal) => sum + meal.cost, 0);
    const totalCarbs = allMeals.reduce((sum, meal) => sum + meal.carbs, 0);
    const totalCalories = allMeals.reduce((sum, meal) => sum + meal.calories, 0);
    
    // Calculate diabetic score (lower GI = higher score)
    const avgGI = allMeals.length > 0
      ? allMeals.reduce((sum, meal) => sum + meal.glycemicIndex, 0) / allMeals.length
      : 70;
    const diabeticScore = Math.max(0, Math.min(100, 100 - avgGI + 20)); // Bonus for fiber
    
    plans.push({
      date: date.toISOString().split('T')[0],
      breakfast,
      lunch,
      dinner,
      snacks,
      totalCost,
      totalCarbs,
      totalCalories,
      diabeticScore: Math.round(diabeticScore),
    });
  }
  
  return plans;
};

/**
 * Find cost-effective alternatives
 */
export const findCostAlternatives = (mealId: string): MealItem[] => {
  const meal = MEAL_DATABASE.find(m => m.id === mealId);
  if (!meal || !meal.alternatives) {
    return [];
  }
  
  return meal.alternatives
    .map(altId => MEAL_DATABASE.find(m => m.id === altId))
    .filter((m): m is MealItem => m !== undefined);
};

/**
 * Get cost comparison message
 */
export const getCostComparison = (originalMeal: MealItem, alternativeMeal: MealItem): string => {
  const savings = originalMeal.cost - alternativeMeal.cost;
  const savingsPercent = Math.round((savings / originalMeal.cost) * 100);
  
  return `Instead of ₹${originalMeal.cost} ${originalMeal.name}, eat ₹${alternativeMeal.cost} ${alternativeMeal.name}. Save ₹${savings} (${savingsPercent}%)`;
};

