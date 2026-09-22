import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Settings, Volume2, Camera, Brain, Download, Trash2, RotateCcw, Shield } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useEHR } from '@/contexts/EHRContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSetting, resetSettings, exportSettings } = useSettings();
  const { ehrSettings, updateEHRSettings } = useEHR();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Auto-focus close button when modal opens
      closeButtonRef.current?.focus();
    }
    
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <Card className="glass-panel w-full max-w-4xl max-h-[80vh] overflow-hidden border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle id="settings-modal-title" className="flex items-center gap-2 text-white">
            <Settings className="w-6 h-6 text-purple-400" aria-hidden="true" />
            Settings
          </CardTitle>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white min-h-[44px] min-w-[44px]"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto">
          <Tabs defaultValue="audio" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-6">
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="accessibility">Access</TabsTrigger>
              <TabsTrigger value="ehr">EHR</TabsTrigger>
            </TabsList>

            <TabsContent value="audio" className="space-y-6">
              <div className="glass-panel p-4 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                  Audio Settings
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Enable Microphone</Label>
                    <Switch
                      checked={settings.audioEnabled}
                      onCheckedChange={(checked) => updateSetting('audioEnabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Microphone Gain</Label>
                    <Slider
                      value={settings.microphoneGain}
                      onValueChange={(value) => updateSetting('microphoneGain', value)}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-400">{settings.microphoneGain[0]}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Noise Reduction</Label>
                    <Switch
                      checked={settings.noiseReduction}
                      onCheckedChange={(checked) => updateSetting('noiseReduction', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Echo Cancellation</Label>
                    <Switch
                      checked={settings.echoCancellation}
                      onCheckedChange={(checked) => updateSetting('echoCancellation', checked)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-6">
              <div className="glass-panel p-4 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-400" />
                  Video Settings
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Enable Camera</Label>
                    <Switch
                      checked={settings.videoEnabled}
                      onCheckedChange={(checked) => updateSetting('videoEnabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Camera Resolution</Label>
                    <Select value={settings.cameraResolution} onValueChange={(value) => updateSetting('cameraResolution', value)}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="480p">480p</SelectItem>
                        <SelectItem value="720p">720p (Recommended)</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Frame Rate</Label>
                    <Select value={settings.frameRate} onValueChange={(value) => updateSetting('frameRate', value)}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15fps">15 FPS</SelectItem>
                        <SelectItem value="30fps">30 FPS (Recommended)</SelectItem>
                        <SelectItem value="60fps">60 FPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <div className="glass-panel p-4 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Analysis Settings
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Real-time Analysis</Label>
                    <Switch
                      checked={settings.realTimeAnalysis}
                      onCheckedChange={(checked) => updateSetting('realTimeAnalysis', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Auto-save Results</Label>
                    <Switch
                      checked={settings.autoSave}
                      onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Analysis Depth</Label>
                    <Select value={settings.analysisDepth} onValueChange={(value) => updateSetting('analysisDepth', value)}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard (Recommended)</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <div className="glass-panel p-4 space-y-4">
                <h3 className="text-lg font-semibold text-white">Privacy & Data</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Data Retention</Label>
                    <Select value={settings.dataRetention} onValueChange={(value) => updateSetting('dataRetention', value)}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">7 Days</SelectItem>
                        <SelectItem value="30days">30 Days</SelectItem>
                        <SelectItem value="90days">90 Days</SelectItem>
                        <SelectItem value="1year">1 Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Anonymous Usage Analytics</Label>
                    <Switch
                      checked={settings.anonymousUsage}
                      onCheckedChange={(checked) => updateSetting('anonymousUsage', checked)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button
                      onClick={exportSettings}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
                    >
                      <Download className="w-4 h-4" />
                      Export Settings
                    </Button>

                    <Button
                      onClick={() => {
                        if (confirm('Reset all settings to default values?')) {
                          resetSettings();
                        }
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset to Defaults
                    </Button>

                    <Button
                      onClick={() => {
                        if (confirm('Are you sure you want to clear all settings? This will reset everything to default values.')) {
                          resetSettings();
                        }
                      }}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Settings
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="accessibility" className="space-y-6">
              <div className="glass-panel p-4 space-y-4">
                <h3 className="text-lg font-semibold text-white">Accessibility</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">High Contrast Mode</Label>
                    <Switch
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Large Text</Label>
                    <Switch
                      checked={settings.largeText}
                      onCheckedChange={(checked) => updateSetting('largeText', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Reduced Motion</Label>
                    <Switch
                      checked={settings.reducedMotion}
                      onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ehr" className="space-y-6">
              <div className="glass-panel p-4 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  EHR Integration
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-gray-300">Enable EHR Integration</Label>
                      <p className="text-xs text-gray-400">
                        Connect with Ayushman Bharat Digital Mission (ABDM)
                      </p>
                    </div>
                    <Switch
                      checked={ehrSettings.enabled}
                      onCheckedChange={(checked) => updateEHRSettings({ enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-gray-300">Auto-Upload Test Results</Label>
                      <p className="text-xs text-gray-400">
                        Automatically upload results to your ABHA health record
                      </p>
                    </div>
                    <Switch
                      checked={ehrSettings.autoUpload}
                      onCheckedChange={(checked) => updateEHRSettings({ autoUpload: checked })}
                      disabled={!ehrSettings.enabled}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-3">
                      EHR integration allows you to:
                    </p>
                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                      <li>Access your complete medical history</li>
                      <li>Share test results with doctors instantly</li>
                      <li>Track health trends over time</li>
                      <li>Get automated referrals to specialists</li>
                      <li>Store results in government-backed secure platform</li>
                    </ul>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      onClose();
                      window.location.href = '/ehr';
                    }}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Go to EHR Integration
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};