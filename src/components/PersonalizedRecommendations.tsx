import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Sparkles,
  Apple,
  Coffee,
  UtensilsCrossed,
  Dumbbell,
  Moon,
  Heart,
  Droplets,
  Activity,
  Brain,
  Clock,
  Footprints,
  Flame,
  Target,
  Salad,
  Cookie,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Smartphone,
  Users,
  Lightbulb,
  Bed,
  Wind,
  Volume2,
  ThermometerSun,
} from 'lucide-react';

interface MealSuggestion {
  name: string;
  description: string;
  calories: number;
}

interface DietPlan {
  dailyCalories: number;
  meals: {
    breakfast: MealSuggestion;
    lunch: MealSuggestion;
    dinner: MealSuggestion;
    snacks: MealSuggestion;
  };
  nutrientsToFocus: string[];
  nutrientsToAvoid: string[];
  hydrationGoal: number;
}

interface ExerciseActivity {
  name: string;
  duration: string;
  frequency: string;
  intensity: string;
  icon: string;
}

interface ExercisePlan {
  weeklyGoal: string;
  activities: ExerciseActivity[];
  activityLevel: string;
  cautions: string[];
}

interface SleepRecommendations {
  recommendedDuration: string;
  bedtimeRoutine: string[];
  sleepHygieneTips: string[];
  environmentTips: string[];
}

interface Recommendations {
  dietPlan: DietPlan;
  exercisePlan: ExercisePlan;
  lifestyleTips: string[];
  sleepRecommendations: SleepRecommendations;
}

type TabType = 'diet' | 'exercise' | 'lifestyle' | 'sleep';

const defaultRecommendations: Recommendations = {
  dietPlan: {
    dailyCalories: 2000,
    meals: {
      breakfast: { name: 'Oatmeal with Berries', description: 'Fiber-rich start with antioxidants', calories: 350 },
      lunch: { name: 'Grilled Chicken Salad', description: 'Lean protein with fresh vegetables', calories: 500 },
      dinner: { name: 'Salmon with Quinoa', description: 'Omega-3 rich with whole grains', calories: 600 },
      snacks: { name: 'Greek Yogurt & Nuts', description: 'Protein and healthy fats', calories: 250 },
    },
    nutrientsToFocus: ['Fiber', 'Omega-3', 'Vitamin D', 'Potassium'],
    nutrientsToAvoid: ['Excess Sodium', 'Saturated Fats', 'Added Sugars'],
    hydrationGoal: 8,
  },
  exercisePlan: {
    weeklyGoal: '150 minutes of moderate activity',
    activities: [
      { name: 'Walking', duration: '30 min', frequency: '5x/week', intensity: 'Moderate', icon: 'walk' },
      { name: 'Yoga', duration: '20 min', frequency: '3x/week', intensity: 'Low', icon: 'yoga' },
      { name: 'Cardio', duration: '20 min', frequency: '3x/week', intensity: 'Moderate-High', icon: 'cardio' },
      { name: 'Strength', duration: '25 min', frequency: '2x/week', intensity: 'Moderate', icon: 'strength' },
    ],
    activityLevel: 'Moderate',
    cautions: ['Start slowly and increase intensity gradually', 'Stay hydrated during exercise'],
  },
  lifestyleTips: [
    'Practice deep breathing for 5 minutes daily',
    'Limit screen time to 2 hours before bed',
    'Connect with friends or family weekly',
    'Start with one small habit change at a time',
    'Take regular breaks during work hours',
  ],
  sleepRecommendations: {
    recommendedDuration: '7-9 hours',
    bedtimeRoutine: ['Dim lights 1 hour before bed', 'Avoid caffeine after 2 PM', 'Read or meditate before sleep'],
    sleepHygieneTips: ['Keep consistent sleep schedule', 'Reserve bed for sleep only', 'Avoid heavy meals before bed'],
    environmentTips: ['Keep room temperature cool (65-68°F)', 'Use blackout curtains', 'Consider white noise'],
  },
};

export const PersonalizedRecommendations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('diet');
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasHealthData, setHasHealthData] = useState(false);

  useEffect(() => {
    // Check if there's any health data in localStorage
    const healthDataKeys = ['bp_readings', 'glucose_readings', 'weight', 'height', 'age', 'healthData'];
    const hasData = healthDataKeys.some((key) => localStorage.getItem(key) !== null);
    setHasHealthData(hasData);

    // Load cached recommendations if available
    const cached = localStorage.getItem('personalized_recommendations');
    if (cached) {
      try {
        setRecommendations(JSON.parse(cached));
      } catch {
        setRecommendations(defaultRecommendations);
      }
    } else {
      setRecommendations(defaultRecommendations);
    }
  }, []);

  const collectHealthData = (): Record<string, unknown> => {
    const data: Record<string, unknown> = {};

    // Collect BP data
    const bpData = localStorage.getItem('bp_readings');
    if (bpData) {
      try {
        data.bloodPressure = JSON.parse(bpData);
      } catch {
        // ignore
      }
    }

    // Collect glucose data
    const glucoseData = localStorage.getItem('glucose_readings');
    if (glucoseData) {
      try {
        data.glucose = JSON.parse(glucoseData);
      } catch {
        // ignore
      }
    }

    // Collect basic health info
    const weight = localStorage.getItem('weight');
    const height = localStorage.getItem('height');
    const age = localStorage.getItem('age');
    const gender = localStorage.getItem('gender');

    if (weight) data.weight = weight;
    if (height) data.height = height;
    if (age) data.age = age;
    if (gender) data.gender = gender;

    // Collect general health data
    const healthData = localStorage.getItem('healthData');
    if (healthData) {
      try {
        data.healthProfile = JSON.parse(healthData);
      } catch {
        // ignore
      }
    }

    return data;
  };

  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const healthData = collectHealthData();
      const hasAnyData = Object.keys(healthData).length > 0;

      const prompt = `You are a health advisor. Based on the following health data, provide personalized health recommendations.

${hasAnyData ? `Health Data: ${JSON.stringify(healthData, null, 2)}` : 'No specific health data available - provide general healthy recommendations for an average adult.'}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "dietPlan": {
    "dailyCalories": <number>,
    "meals": {
      "breakfast": { "name": "<string>", "description": "<string>", "calories": <number> },
      "lunch": { "name": "<string>", "description": "<string>", "calories": <number> },
      "dinner": { "name": "<string>", "description": "<string>", "calories": <number> },
      "snacks": { "name": "<string>", "description": "<string>", "calories": <number> }
    },
    "nutrientsToFocus": ["<string>", "<string>", "<string>", "<string>"],
    "nutrientsToAvoid": ["<string>", "<string>", "<string>"],
    "hydrationGoal": <number of glasses>
  },
  "exercisePlan": {
    "weeklyGoal": "<string>",
    "activities": [
      { "name": "<string>", "duration": "<string>", "frequency": "<string>", "intensity": "<string>", "icon": "walk|yoga|cardio|strength" }
    ],
    "activityLevel": "<string>",
    "cautions": ["<string>"]
  },
  "lifestyleTips": ["<string>", "<string>", "<string>", "<string>", "<string>"],
  "sleepRecommendations": {
    "recommendedDuration": "<string>",
    "bedtimeRoutine": ["<string>", "<string>", "<string>"],
    "sleepHygieneTips": ["<string>", "<string>", "<string>"],
    "environmentTips": ["<string>", "<string>", "<string>"]
  }
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean up the response
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const parsed: Recommendations = JSON.parse(text);
      setRecommendations(parsed);

      // Cache the results
      localStorage.setItem('personalized_recommendations', JSON.stringify(parsed));
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
      if (!recommendations) {
        setRecommendations(defaultRecommendations);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'diet', label: 'Diet Plan', icon: <Apple className="w-4 h-4" /> },
    { id: 'exercise', label: 'Exercise', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'lifestyle', label: 'Lifestyle', icon: <Heart className="w-4 h-4" /> },
    { id: 'sleep', label: 'Sleep', icon: <Moon className="w-4 h-4" /> },
  ];

  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case 'walk':
        return <Footprints className="w-5 h-5" />;
      case 'yoga':
        return <Wind className="w-5 h-5" />;
      case 'cardio':
        return <Activity className="w-5 h-5" />;
      case 'strength':
        return <Dumbbell className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-white/10 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-white/10 rounded w-2/3"></div>
    </div>
  );

  const renderDietPlan = () => {
    if (!recommendations) return null;
    const { dietPlan } = recommendations;

    return (
      <div className="space-y-8">
        {/* Daily Calorie Target */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm mb-1">Daily Calorie Target</p>
              <p className="text-4xl font-bold text-white">{dietPlan.dailyCalories}</p>
              <p className="text-white/40 text-sm mt-1">calories/day</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center">
              <Flame className="w-8 h-8 text-teal-400" />
            </div>
          </div>
        </div>

        {/* Meal Suggestions */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Meal Suggestions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Breakfast */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Breakfast</p>
                  <p className="text-white font-medium">{dietPlan.meals.breakfast.name}</p>
                </div>
              </div>
              <p className="text-white/60 text-sm mb-2">{dietPlan.meals.breakfast.description}</p>
              <p className="text-teal-400 text-sm font-medium">{dietPlan.meals.breakfast.calories} cal</p>
            </div>

            {/* Lunch */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Salad className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Lunch</p>
                  <p className="text-white font-medium">{dietPlan.meals.lunch.name}</p>
                </div>
              </div>
              <p className="text-white/60 text-sm mb-2">{dietPlan.meals.lunch.description}</p>
              <p className="text-teal-400 text-sm font-medium">{dietPlan.meals.lunch.calories} cal</p>
            </div>

            {/* Dinner */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Dinner</p>
                  <p className="text-white font-medium">{dietPlan.meals.dinner.name}</p>
                </div>
              </div>
              <p className="text-white/60 text-sm mb-2">{dietPlan.meals.dinner.description}</p>
              <p className="text-teal-400 text-sm font-medium">{dietPlan.meals.dinner.calories} cal</p>
            </div>

            {/* Snacks */}
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Cookie className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Snacks</p>
                  <p className="text-white font-medium">{dietPlan.meals.snacks.name}</p>
                </div>
              </div>
              <p className="text-white/60 text-sm mb-2">{dietPlan.meals.snacks.description}</p>
              <p className="text-teal-400 text-sm font-medium">{dietPlan.meals.snacks.calories} cal</p>
            </div>
          </div>
        </div>

        {/* Nutrients */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h4 className="text-white font-medium">Nutrients to Focus On</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {dietPlan.nutrientsToFocus.map((nutrient, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm"
                >
                  {nutrient}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h4 className="text-white font-medium">Nutrients to Limit</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {dietPlan.nutrientsToAvoid.map((nutrient, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-sm"
                >
                  {nutrient}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Hydration */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Droplets className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-medium">Daily Hydration Goal</h4>
              <p className="text-white/60 text-sm">
                Drink at least <span className="text-blue-400 font-semibold">{dietPlan.hydrationGoal} glasses</span> of water daily
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderExercisePlan = () => {
    if (!recommendations) return null;
    const { exercisePlan } = recommendations;

    return (
      <div className="space-y-8">
        {/* Weekly Goal */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm mb-1">Weekly Exercise Goal</p>
              <p className="text-2xl font-bold text-white">{exercisePlan.weeklyGoal}</p>
              <p className="text-white/40 text-sm mt-2">
                Activity Level: <span className="text-teal-400">{exercisePlan.activityLevel}</span>
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center">
              <Target className="w-8 h-8 text-teal-400" />
            </div>
          </div>
        </div>

        {/* Activities */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Recommended Activities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercisePlan.activities.map((activity, index) => (
              <div
                key={index}
                className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                    {getActivityIcon(activity.icon)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{activity.name}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <p className="text-white/60 text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {activity.duration}
                      </p>
                      <p className="text-white/60 text-sm">{activity.frequency}</p>
                    </div>
                    <p className="text-teal-400 text-xs mt-1">{activity.intensity} intensity</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cautions */}
        {exercisePlan.cautions.length > 0 && (
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h4 className="text-white font-medium">Exercise Cautions</h4>
            </div>
            <ul className="space-y-2">
              {exercisePlan.cautions.map((caution, index) => (
                <li key={index} className="text-white/60 text-sm flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  {caution}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderLifestyleTips = () => {
    if (!recommendations) return null;
    const { lifestyleTips } = recommendations;

    const icons = [Brain, Smartphone, Users, Lightbulb, Clock];

    return (
      <div className="space-y-8">
        {/* Stress Management */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Lifestyle Recommendations</h3>
          <div className="space-y-4">
            {lifestyleTips.map((tip, index) => {
              const Icon = icons[index % icons.length];
              return (
                <div
                  key={index}
                  className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400 font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-white">{tip}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Tips Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="text-white font-medium mb-1">Screen Time</h4>
            <p className="text-white/60 text-sm">Limit to 2 hours before bed</p>
          </div>

          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <h4 className="text-white font-medium mb-1">Social Wellness</h4>
            <p className="text-white/60 text-sm">Connect with loved ones weekly</p>
          </div>

          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="text-white font-medium mb-1">Habit Formation</h4>
            <p className="text-white/60 text-sm">One small change at a time</p>
          </div>
        </div>
      </div>
    );
  };

  const renderSleepRecommendations = () => {
    if (!recommendations) return null;
    const { sleepRecommendations } = recommendations;

    return (
      <div className="space-y-8">
        {/* Sleep Duration */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm mb-1">Recommended Sleep Duration</p>
              <p className="text-4xl font-bold text-white">{sleepRecommendations.recommendedDuration}</p>
              <p className="text-white/40 text-sm mt-1">per night</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Moon className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Bedtime Routine */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bed className="w-5 h-5 text-indigo-400" />
            <h4 className="text-white font-medium">Bedtime Routine</h4>
          </div>
          <ul className="space-y-3">
            {sleepRecommendations.bedtimeRoutine.map((item, index) => (
              <li key={index} className="flex items-center gap-3 text-white/80">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-400 text-xs font-medium">{index + 1}</span>
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Sleep Hygiene Tips */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Sleep Hygiene Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sleepRecommendations.sleepHygieneTips.map((tip, index) => (
              <div
                key={index}
                className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-3">
                  <Moon className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-white text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Environment Tips */}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
          <h4 className="text-white font-medium mb-4">Sleep Environment Tips</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sleepRecommendations.environmentTips.map((tip, index) => {
              const icons = [ThermometerSun, Moon, Volume2];
              const Icon = icons[index % icons.length];
              const colors = ['text-orange-400', 'text-indigo-400', 'text-blue-400'];
              const bgColors = ['bg-orange-500/20', 'bg-indigo-500/20', 'bg-blue-500/20'];
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${bgColors[index % bgColors.length]} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${colors[index % colors.length]}`} />
                  </div>
                  <p className="text-white/80 text-sm">{tip}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <SkeletonCard />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      );
    }

    switch (activeTab) {
      case 'diet':
        return renderDietPlan();
      case 'exercise':
        return renderExercisePlan();
      case 'lifestyle':
        return renderLifestyleTips();
      case 'sleep':
        return renderSleepRecommendations();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Personalized Recommendations</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 text-xs rounded-full font-medium">
                AI Powered
              </span>
              {!hasHealthData && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                  General recommendations
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={generateRecommendations}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white rounded-xl font-medium transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Generate Recommendations
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white/[0.12] text-white border border-white/[0.15]'
                : 'bg-white/[0.04] text-white/60 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/80'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

