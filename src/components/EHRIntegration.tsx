/**
 * EHR Integration Component
 * ABHA ID authentication, medical history display, and settings
 */

import React, { useState } from 'react';
import { useEHR } from '@/contexts/EHRContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart,
  Shield,
  Hospital,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  LogOut,
  RefreshCw,
  Link as LinkIcon,
  Settings,
  User,
  Calendar,
  Pill,
  Activity,
} from 'lucide-react';
import { ehrService } from '@/services/ehrService';

export const EHRIntegration: React.FC = () => {
  const {
    isAuthenticated,
    abhaProfile,
    medicalHistory,
    ehrSettings,
    updateEHRSettings,
    authenticateWithABHA,
    fetchMedicalHistory,
    logout,
    isLoading,
    error,
  } = useEHR();

  const [abhaInput, setAbhaInput] = useState('');
  const [authMode, setAuthMode] = useState<'MOBILE_OTP' | 'AADHAAR_OTP' | 'PASSWORD'>('MOBILE_OTP');
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle ABHA ID input with formatting
  const handleABHAInput = (value: string) => {
    const formatted = ehrService.formatABHAId(value);
    setAbhaInput(formatted);
    setLocalError(null);
  };

  // Handle authentication
  const handleAuthenticate = async () => {
    if (!ehrService.isValidABHAId(abhaInput)) {
      setLocalError('Invalid ABHA ID format. Expected: XX-XXXX-XXXX-XXXX');
      return;
    }

    const success = await authenticateWithABHA(abhaInput, authMode);
    if (success) {
      setAbhaInput('');
    }
  };

  // Render authentication form
  const renderAuthForm = () => (
    <Card className="glass-panel border-l-4 border-blue-500">
      <CardHeader className="bg-transparent pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <CardTitle className="text-lg text-foreground">
            Connect to ABDM (Ayushman Bharat)
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground mt-1">
          Link your ABHA ID to access your medical records and enable EHR integration
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="abha-id" className="text-sm font-medium text-foreground">ABHA ID</Label>
            <Input
              id="abha-id"
              placeholder="XX-XXXX-XXXX-XXXX"
              value={abhaInput}
              onChange={(e) => handleABHAInput(e.target.value)}
              maxLength={17}
              disabled={isLoading}
              className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-muted-foreground">
              Enter your 14-digit ABHA ID (Ayushman Bharat Health Account)
            </p>
          </div>

          {(localError || error) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{localError || error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleAuthenticate}
            disabled={isLoading || !abhaInput}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4 mr-2" />
                Connect ABHA ID
              </>
            )}
          </Button>
        </div>

        <div className="border-t border-white/10 pt-4">
          <h4 className="text-sm font-semibold mb-3 text-foreground">Why Connect Your ABHA ID?</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
              <span>Access your complete medical history instantly</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
              <span>Auto-upload test results to your health records</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
              <span>Share results with doctors seamlessly</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
              <span>Track your health trends over time</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Don't have an ABHA ID?</strong> Create one for free at{' '}
            <a
              href="https://abha.abdm.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-400 hover:text-blue-300 transition-colors"
            >
              abha.abdm.gov.in
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );

  // Render patient profile
  const renderProfile = () => {
    if (!abhaProfile) return null;

    return (
      <Card className="glass-panel border-l-4 border-blue-500">
        <CardHeader className="bg-transparent pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg text-foreground">
                Patient Profile
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
          <CardDescription className="text-sm text-muted-foreground mt-1">Your ABDM health profile information</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground font-medium">ABHA ID</Label>
              <p className="font-mono font-semibold text-foreground mt-1">{abhaProfile.abhaId}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">ABHA Address</Label>
              <p className="font-mono text-muted-foreground mt-1">{abhaProfile.abhaAddress}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Name</Label>
              <p className="font-semibold text-foreground mt-1">{abhaProfile.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Gender</Label>
              <p className="text-muted-foreground mt-1">{abhaProfile.gender === 'M' ? 'Male' : abhaProfile.gender === 'F' ? 'Female' : 'Other'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Date of Birth</Label>
              <p className="text-muted-foreground mt-1">{new Date(abhaProfile.dateOfBirth).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Mobile</Label>
              <p className="text-muted-foreground mt-1">{abhaProfile.mobile}</p>
            </div>
          </div>

          {abhaProfile.address && (
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Address</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {abhaProfile.address.line}, {abhaProfile.address.district},{' '}
                {abhaProfile.address.state} - {abhaProfile.address.pincode}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Badge
              className="bg-green-600 text-white"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected to ABDM
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render medical history
  const renderMedicalHistory = () => {
    if (!medicalHistory) {
      return (
        <Card className="glass-panel border-l-4 border-blue-500">
          <CardHeader className="bg-transparent pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg text-foreground">
                Medical History
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center py-8">
              <Button
                onClick={fetchMedicalHistory}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Fetch Medical History
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="glass-panel border-l-4 border-blue-500">
        <CardHeader className="bg-transparent pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg text-foreground">
                Medical History
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMedicalHistory}
              disabled={isLoading}
              className="border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Last updated: {new Date(medicalHistory.lastUpdated).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="conditions">
            <TabsList className="grid w-full grid-cols-4 gap-1 p-1 rounded-lg bg-black/40">
              <TabsTrigger
                value="conditions"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-foreground data-[state=active]:font-semibold rounded-md py-2.5 text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                Conditions
              </TabsTrigger>
              <TabsTrigger
                value="medications"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-foreground data-[state=active]:font-semibold rounded-md py-2.5 text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                Medications
              </TabsTrigger>
              <TabsTrigger
                value="allergies"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-foreground data-[state=active]:font-semibold rounded-md py-2.5 text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                Allergies
              </TabsTrigger>
              <TabsTrigger
                value="vitals"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-foreground data-[state=active]:font-semibold rounded-md py-2.5 text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                Vitals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conditions" className="mt-4 space-y-3">
              {medicalHistory.conditions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 font-medium">No conditions recorded</p>
              ) : (
                medicalHistory.conditions.map((condition, idx) => (
                  <div key={idx} className="border border-white/10 rounded-lg p-4 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-foreground mb-1">{condition.name}</h4>
                        <p className="text-xs text-muted-foreground font-medium">Code: {condition.code}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge
                          className={
                            condition.status === 'active'
                              ? 'bg-blue-600 text-white font-semibold'
                              : condition.status === 'chronic'
                                ? 'bg-gray-700 text-white font-semibold'
                                : 'bg-gray-500 text-white font-semibold'
                          }
                        >
                          {condition.status}
                        </Badge>
                        {condition.severity && (
                          <Badge
                            className={
                              condition.severity === 'severe' || condition.severity === 'life-threatening'
                                ? 'bg-red-600 text-white font-semibold text-xs'
                                : condition.severity === 'moderate'
                                  ? 'bg-orange-500 text-white font-semibold text-xs'
                                  : 'bg-gray-500 text-white font-semibold text-xs'
                            }
                          >
                            {condition.severity}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(condition.diagnosedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="medications" className="mt-4 space-y-3">
              {medicalHistory.medications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 font-medium">No medications recorded</p>
              ) : (
                medicalHistory.medications.map((med, idx) => (
                  <div key={idx} className="border border-white/10 rounded-lg p-4 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Pill className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-foreground mb-1">{med.name}</h4>
                        <p className="text-sm text-muted-foreground font-medium mt-1">
                          {med.dosage} - {med.frequency}
                        </p>
                        {med.purpose && (
                          <p className="text-xs text-muted-foreground mt-2 font-medium">Purpose: {med.purpose}</p>
                        )}
                        <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-3 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Since {new Date(med.startDate).toLocaleDateString()}
                          </span>
                          {med.prescribedBy && <span>• Prescribed by {med.prescribedBy}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="allergies" className="mt-4 space-y-3">
              {medicalHistory.allergies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 font-medium">No allergies recorded</p>
              ) : (
                medicalHistory.allergies.map((allergy, idx) => (
                  <div key={idx} className="border border-orange-500/20 rounded-lg p-4 bg-orange-500/10 hover:bg-orange-500/15 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-base font-bold flex items-center gap-2 text-foreground mb-1">
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                          {allergy.allergen}
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium mt-1">Reaction: {allergy.reaction}</p>
                      </div>
                      <Badge
                        className={
                          allergy.severity === 'life-threatening'
                            ? 'bg-red-700 text-white font-bold'
                            : allergy.severity === 'severe'
                              ? 'bg-red-600 text-white font-bold'
                              : allergy.severity === 'moderate'
                                ? 'bg-orange-500 text-white font-bold'
                                : 'bg-gray-600 text-white font-bold'
                        }
                      >
                        {allergy.severity}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t border-orange-500/20">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Verified: {new Date(allergy.verifiedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="vitals" className="mt-4 space-y-3">
              {medicalHistory.vitals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 font-medium">No vitals recorded</p>
              ) : (
                medicalHistory.vitals.slice(0, 5).map((vital, idx) => (
                  <div key={idx} className="border border-white/10 rounded-lg p-4 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <h4 className="text-base font-bold flex items-center gap-2 text-foreground">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Vital Signs
                      </h4>
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(vital.recordedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {vital.bloodPressure && (
                        <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                          <Label className="text-xs text-muted-foreground font-semibold">Blood Pressure</Label>
                          <p className="font-bold text-lg text-red-400 mt-1">
                            {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">mmHg</p>
                        </div>
                      )}
                      {vital.heartRate && (
                        <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                          <Label className="text-xs text-muted-foreground font-semibold">Heart Rate</Label>
                          <p className="font-bold text-lg text-blue-400 mt-1">{vital.heartRate}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">bpm</p>
                        </div>
                      )}
                      {vital.temperature && (
                        <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                          <Label className="text-xs text-muted-foreground font-semibold">Temperature</Label>
                          <p className="font-bold text-lg text-orange-400 mt-1">{vital.temperature}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">°F</p>
                        </div>
                      )}
                      {vital.oxygenSaturation && (
                        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                          <Label className="text-xs text-muted-foreground font-semibold">SpO2</Label>
                          <p className="font-bold text-lg text-green-400 mt-1">{vital.oxygenSaturation}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">%</p>
                        </div>
                      )}
                      {vital.weight && (
                        <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                          <Label className="text-xs text-muted-foreground font-semibold">Weight</Label>
                          <p className="font-bold text-lg text-purple-400 mt-1">{vital.weight}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">kg</p>
                        </div>
                      )}
                      {vital.height && (
                        <div className="bg-indigo-500/10 rounded-lg p-3 border border-indigo-500/20">
                          <Label className="text-xs text-muted-foreground font-semibold">Height</Label>
                          <p className="font-bold text-lg text-indigo-400 mt-1">{vital.height}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">cm</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  // Render EHR settings
  const renderSettings = () => (
    <Card className="glass-panel border-l-4 border-blue-500">
      <CardHeader className="bg-transparent pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500" />
          <CardTitle className="text-lg text-foreground">
            EHR Integration Settings
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground mt-1">Configure how Health Scan integrates with your health records</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="space-y-0.5 flex-1">
            <Label className="text-sm font-bold text-foreground">Enable EHR Integration</Label>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Connect to ABDM health records</p>
          </div>
          <Switch
            checked={ehrSettings.enabled}
            onCheckedChange={(checked) => updateEHRSettings({ enabled: checked })}
            disabled={!isAuthenticated}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="space-y-0.5 flex-1">
            <Label className="text-sm font-bold text-foreground">Auto-Upload Test Results</Label>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Automatically save results to your EHR</p>
          </div>
          <Switch
            checked={ehrSettings.autoUpload}
            onCheckedChange={(checked) => updateEHRSettings({ autoUpload: checked })}
            disabled={!ehrSettings.enabled}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="space-y-0.5 flex-1">
            <Label className="text-sm font-bold text-foreground">Share with Doctors</Label>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Allow doctors to view your test results</p>
          </div>
          <Switch
            checked={ehrSettings.shareWithDoctors}
            onCheckedChange={(checked) => updateEHRSettings({ shareWithDoctors: checked })}
            disabled={!ehrSettings.enabled}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="space-y-0.5 flex-1">
            <Label className="text-sm font-bold text-foreground">Longitudinal Tracking</Label>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Track health trends over time</p>
          </div>
          <Switch
            checked={ehrSettings.longitudinalTracking}
            onCheckedChange={(checked) => updateEHRSettings({ longitudinalTracking: checked })}
            disabled={!ehrSettings.enabled}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="space-y-0.5 flex-1">
            <Label className="text-sm font-bold text-foreground">Auto-Referral</Label>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Automatically refer high-risk cases to neurologists</p>
          </div>
          <Switch
            checked={ehrSettings.autoReferral}
            onCheckedChange={(checked) => updateEHRSettings({ autoReferral: checked })}
            disabled={!ehrSettings.enabled}
          />
        </div>

        {ehrSettings.enabled && !ehrSettings.consentGiven && (
          <Alert className="border-blue-500/20 bg-blue-500/10">
            <Shield className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-muted-foreground">
              <p className="font-semibold mb-2 text-foreground">Data Sharing Consent Required</p>
              <p className="text-sm mb-3">
                By enabling EHR integration, you consent to sharing your test results with healthcare providers
                through the ABDM network.
              </p>
              <Button
                size="sm"
                onClick={() => updateEHRSettings({ consentGiven: true, consentDate: new Date().toISOString() })}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                I Consent
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {!isAuthenticated ? (
        renderAuthForm()
      ) : (
        <>
          {renderProfile()}
          {renderMedicalHistory()}
          {renderSettings()}
        </>
      )}
    </div>
  );
};

