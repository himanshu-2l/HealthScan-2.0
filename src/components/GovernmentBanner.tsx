/**
 * Government Banner Component
 * Displays Indian government health mission banners and slogans
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Heart, Activity, CheckCircle } from 'lucide-react';

export const GovernmentBanner: React.FC = () => {
  const missions = [
    {
      name: 'Ayushman Bharat',
      slogan: 'स्वस्थ भारत, समृद्ध भारत',
      english: 'Healthy India, Prosperous India',
      color: 'bg-blue-600',
      icon: Heart,
    },
    {
      name: 'ABDM',
      slogan: 'Digital Health for All',
      english: 'Ayushman Bharat Digital Mission',
      color: 'bg-green-600',
      icon: Shield,
    },
    {
      name: 'Swachh Bharat',
      slogan: 'एक कदम स्वच्छता की ओर',
      english: 'One Step Towards Cleanliness',
      color: 'bg-orange-500',
      icon: CheckCircle,
    },
  ];

  return (
    <div className="w-full pt-24 pb-6">
      <div className="container mx-auto px-4">
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center gap-6 text-center border-0 bg-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-white to-orange-500 opacity-50"></div>

          {/* Main Slogan */}
          <div className="max-w-4xl relative z-10">
            <p className="text-xl md:text-2xl font-bold text-white leading-relaxed drop-shadow-sm">
              "Health does not simply mean freedom from diseases. A healthy life is everyone's right."
            </p>
            <p className="text-sm md:text-base text-gray-300 mt-3 font-medium">
              - Prime Minister of India
            </p>
          </div>

          {/* Mission Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 relative z-10">
            {missions.map((mission, index) => {
              const Icon = mission.icon;
              return (
                <div
                  key={index}
                  className={`${mission.color} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-white/20 backdrop-blur-sm`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm">{mission.name}</span>
                    <span className="text-xs opacity-90">{mission.english}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

