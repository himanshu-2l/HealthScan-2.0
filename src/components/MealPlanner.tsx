/**
 * Smart Meal Planner for Diabetics Component
 * Regional Indian foods with cost awareness
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  UtensilsCrossed,
  MapPin,
  IndianRupee,
  TrendingDown,
  Lightbulb,
  Calendar,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Sparkles,
  Leaf,
} from 'lucide-react';
import {
  generateMealPlan,
  findCostAlternatives,
  getCostComparison,
  IndianRegion,
  MealPlan,
  MealItem,
} from '@/services/mealPlannerService';
import { format } from 'date-fns';

const mealTypeIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snacks: Cookie,
};

const mealTypeColors = {
  breakfast: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  lunch: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  dinner: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  snacks: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
};

export const MealPlanner: React.FC = () => {
  const [region, setRegion] = useState<IndianRegion>('central');
  const [budgetPerDay, setBudgetPerDay] = useState<string>('150');
  const [targetCarbs, setTargetCarbs] = useState<string>('150');
  const [targetCalories, setTargetCalories] = useState<string>('1800');
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);

  const handleGeneratePlan = () => {
    const plans = generateMealPlan(
      region,
      parseFloat(budgetPerDay) || 150,
      parseFloat(targetCarbs) || 150,
      parseFloat(targetCalories) || 1800,
      7
    );
    setMealPlans(plans);
  };

  const getRegionLabel = (reg: IndianRegion): string => {
    const labels: Record<IndianRegion, string> = {
      'north': 'North India',
      'south': 'South India',
      'east': 'East India',
      'west': 'West India',
      'central': 'Central India',
      'northeast': 'Northeast India',
      'rajasthan': 'Rajasthan',
      'mp-chhattisgarh': 'MP & Chhattisgarh',
      'punjab-haryana': 'Punjab & Haryana',
    };
    return labels[reg];
  };

  const renderMealSection = (meals: MealItem[], mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', showAlternatives = false) => {
    if (meals.length === 0) return null;
    const Icon = mealTypeIcons[mealType];
    const colorClass = mealTypeColors[mealType];

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${colorClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-white capitalize">{mealType}</span>
        </div>
        <div className="space-y-2">
          {meals.map((meal) => {
            const mealAlternatives = showAlternatives && meal.alternatives
              ? findCostAlternatives(meal.id)
              : [];

            return (
              <div key={meal.id} className="space-y-2">
                <div className="bg-white/[0.02] hover:bg-white/[0.04] rounded-xl p-4 border border-white/[0.04] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{meal.name}</span>
                        {meal.nameHindi && (
                          <span className="text-sm text-white/40">({meal.nameHindi})</span>
                        )}
                        {meal.diabeticFriendly && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                            <Leaf className="w-3 h-3" />
                            Diabetic-Friendly
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/50">
                        <span>{meal.servingSize}</span>
                        <span className="w-1 h-1 rounded-full bg-white/30" />
                        <span>GI: {meal.glycemicIndex}</span>
                        <span className="w-1 h-1 rounded-full bg-white/30" />
                        <span>{meal.carbs}g carbs</span>
                        <span className="w-1 h-1 rounded-full bg-white/30" />
                        <span>{meal.calories} kcal</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <IndianRupee className="w-3.5 h-3.5 mr-1" />
                      {meal.cost}
                    </span>
                  </div>
                </div>

                {/* Cost Alternatives */}
                {mealAlternatives.length > 0 && (
                  <div className="ml-4 bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">💰 Cost-Effective Alternative</span>
                    </div>
                    {mealAlternatives.map((alt) => (
                      <p key={alt.id} className="text-sm text-white/60">
                        {getCostComparison(meal, alt)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="p-2.5 sm:p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
          <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold text-white truncate">Smart Meal Planner</h2>
          <p className="text-xs sm:text-sm text-white/50">Diabetic-friendly meals based on your region and budget</p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-white/80">Region *</label>
            <Select value={region} onValueChange={(v: IndianRegion) => setRegion(v)}>
              <SelectTrigger className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white h-11 sm:h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="north">North India</SelectItem>
                <SelectItem value="south">South India</SelectItem>
                <SelectItem value="east">East India</SelectItem>
                <SelectItem value="west">West India</SelectItem>
                <SelectItem value="central">Central India</SelectItem>
                <SelectItem value="northeast">Northeast India</SelectItem>
                <SelectItem value="rajasthan">Rajasthan</SelectItem>
                <SelectItem value="mp-chhattisgarh">MP & Chhattisgarh</SelectItem>
                <SelectItem value="punjab-haryana">Punjab & Haryana</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-white/80">Daily Budget (₹) *</label>
            <Input
              type="number"
              value={budgetPerDay}
              onChange={(e) => setBudgetPerDay(e.target.value)}
              placeholder="150"
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-orange-500/50 h-11 sm:h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-white/80">Target Carbs (g/day)</label>
            <Input
              type="number"
              value={targetCarbs}
              onChange={(e) => setTargetCarbs(e.target.value)}
              placeholder="150"
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-orange-500/50 h-11 sm:h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-white/80">Target Calories (kcal/day)</label>
            <Input
              type="number"
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
              placeholder="1800"
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:border-orange-500/50 h-11 sm:h-12"
            />
          </div>
        </div>

        <Button
          onClick={handleGeneratePlan}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 sm:h-12 text-sm sm:text-base"
        >
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Generate 7-Day Meal Plan
        </Button>
      </div>

      {/* Meal Plans */}
      {mealPlans.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-white/40" />
            <span className="text-white/60">
              Region: <strong className="text-white">{getRegionLabel(region)}</strong>
            </span>
          </div>

          <div className="space-y-6">
            {mealPlans.map((plan, idx) => (
              <div key={idx} className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
                {/* Day Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg font-semibold text-white">
                      {format(new Date(plan.date), 'EEEE')}
                    </span>
                    <span className="text-white/40 text-sm">
                      {format(new Date(plan.date), 'MMMM dd')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 w-fit">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Score: {plan.diabeticScore}/100
                  </span>
                </div>

                {/* Meals Grid */}
                <div className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderMealSection(plan.breakfast, 'breakfast')}
                    {renderMealSection(plan.lunch, 'lunch')}
                    {renderMealSection(plan.dinner, 'dinner', true)}
                    {renderMealSection(plan.snacks, 'snacks')}
                  </div>

                  {/* Daily Summary */}
                  <div className="pt-4 sm:pt-6 border-t border-white/[0.06]">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="bg-white/[0.02] rounded-xl p-3 sm:p-4 text-center">
                        <span className="text-xs sm:text-sm text-white/50 block mb-1">Total Cost</span>
                        <div className="flex items-center justify-center text-lg sm:text-xl font-bold text-white">
                          <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
                          {plan.totalCost}
                        </div>
                      </div>
                      <div className="bg-white/[0.02] rounded-xl p-3 sm:p-4 text-center">
                        <span className="text-xs sm:text-sm text-white/50 block mb-1">Total Carbs</span>
                        <span className="text-lg sm:text-xl font-bold text-white">{plan.totalCarbs}g</span>
                      </div>
                      <div className="bg-white/[0.02] rounded-xl p-3 sm:p-4 text-center">
                        <span className="text-xs sm:text-sm text-white/50 block mb-1">Total Calories</span>
                        <span className="text-lg sm:text-xl font-bold text-white">{plan.totalCalories} kcal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Tip */}
      <div className="bg-blue-500/10 rounded-2xl p-4 sm:p-5 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-white mb-1 text-sm sm:text-base">Pro Tip</p>
            <p className="text-xs sm:text-sm text-white/60">
              All meals are selected from diabetic-friendly options with lower glycemic index.
              Cost-effective alternatives are shown when available. Adjust portions based on your individual needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanner;
