import React from 'react';
import { useTheme, ThemeType } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette, Check } from 'lucide-react';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ isOpen, onClose }) => {
  const { currentTheme, setTheme, themeNames } = useTheme();

  const themeOptions: { id: ThemeType; name: string; description: string; preview: string }[] = [
    {
      id: 'violet',
      name: themeNames.violet,
      description: 'Soft violet with purple accents',
      preview: 'bg-gradient-to-r from-violet-500 to-purple-600'
    },
    {
      id: 'blue',
      name: themeNames.blue,
      description: 'Ocean blue with indigo depths',
      preview: 'bg-gradient-to-r from-blue-500 to-indigo-600'
    },
    {
      id: 'purple',
      name: themeNames.purple,
      description: 'Royal purple with pink highlights',
      preview: 'bg-gradient-to-r from-purple-600 to-pink-600'
    },
    {
      id: 'cosmic',
      name: themeNames.cosmic,
      description: 'Multi-color cosmic gradient',
      preview: 'bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="glass-panel w-full max-w-2xl max-h-[80vh] overflow-y-auto border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Palette className="w-6 h-6" />
            Choose Theme
          </CardTitle>
          <CardDescription className="text-gray-300">
            Select your preferred color palette for Health Scan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themeOptions.map((theme) => (
              <div
                key={theme.id}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${currentTheme === theme.id
                    ? 'border-primary bg-primary/20 shadow-lg scale-[1.02]'
                    : 'border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 hover:scale-[1.01]'
                  }`}
                onClick={() => setTheme(theme.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{theme.name}</h3>
                    {currentTheme === theme.id && (
                      <Check className="w-5 h-5 text-green-400" />
                    )}
                  </div>

                  <div className={`h-12 rounded-lg ${theme.preview}`} />

                  <p className="text-sm text-gray-300">{theme.description}</p>

                  {currentTheme === theme.id && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeSelector;
