import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Loader2, 
  Shield, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Stethoscope, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  HeartPulse
} from 'lucide-react';
import { HealthScanLogo } from '@/components/HealthScanLogo';

const Login: React.FC = () => {
  const { 
    currentUser, 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    loginAsDemo, 
    isFirebaseConfigured 
  } = useAuth();

  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithEmail(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name || !email || !password) {
      setErrorMessage('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerWithEmail(name, email, password, role);
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed. Please try a different email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Subtle ambient clinical aura */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-teal-500/10 via-emerald-500/5 to-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-teal-600/[0.06] rounded-full blur-[100px]" />
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-3xl p-6 sm:p-8">
          
          {/* Brand Header */}
          <div className="text-center mb-6">
            <HealthScanLogo size="lg" glow={true} className="mb-3" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Health<span className="text-teal-400">Scan</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Clinical-Grade Physiological AI Telemetry Suite
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tabs: Sign In / Create Account */}
          <Tabs value={authTab} onValueChange={(val) => setAuthTab(val as 'signin' | 'signup')} className="w-full">
            <TabsList className="grid grid-cols-2 w-full p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl mb-5">
              <TabsTrigger 
                value="signin" 
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-teal-500 data-[state=active]:text-white text-slate-400 transition-all"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-teal-500 data-[state=active]:text-white text-slate-400 transition-all"
              >
                Create Account
              </TabsTrigger>
            </TabsList>

            {/* TAB: SIGN IN */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      placeholder="alex.rivera@abdm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus:border-teal-400 focus:ring-teal-400/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus:border-teal-400 focus:ring-teal-400/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl shadow-lg shadow-teal-500/20 transition-all duration-200 mt-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  {isLoading ? 'Signing In...' : 'Sign In to HealthScan'}
                </Button>
              </form>
            </TabsContent>

            {/* TAB: CREATE ACCOUNT */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-slate-300">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-10 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus:border-teal-400 focus:ring-teal-400/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus:border-teal-400 focus:ring-teal-400/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-slate-300">Password (min 6 chars)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus:border-teal-400 focus:ring-teal-400/20"
                    />
                  </div>
                </div>

                {/* Account Role Selector */}
                <div className="space-y-1.5 text-left pt-1">
                  <label className="text-xs font-medium text-slate-300">Account Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('patient')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        role === 'patient'
                          ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <HeartPulse className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold leading-none">Patient</div>
                        <div className="text-[10px] opacity-60">Personal Health</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('doctor')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        role === 'doctor'
                          ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <Stethoscope className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold leading-none">Clinician</div>
                        <div className="text-[10px] opacity-60">Doctor / Nurse</div>
                      </div>
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl shadow-lg shadow-teal-500/20 transition-all duration-200 mt-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Social Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-3 text-slate-400">or continue with</span>
            </div>
          </div>

          {/* Google Sign-in */}
          <Button
            type="button"
            disabled={isGoogleLoading}
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-11 text-xs font-semibold bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 border-white/[0.1] rounded-xl transition-all"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Google Account
          </Button>

          {/* Instant 1-Click Demo Profiles for Hackathon Judges */}
          <div className="mt-5 p-3.5 rounded-2xl bg-teal-500/[0.06] border border-teal-500/20 text-left">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-bold text-teal-300">Instant Demo Access (No Password Required)</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Explore full features, clinical labs, and populated vitals histories instantly:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loginAsDemo('patient')}
                className="py-2 px-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-200 text-xs font-semibold text-center transition-all active:scale-95"
              >
                👤 Patient Demo<br /><span className="text-[10px] text-teal-300/70 font-normal">Alex Rivera</span>
              </button>
              <button
                type="button"
                onClick={() => loginAsDemo('doctor')}
                className="py-2 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 text-xs font-semibold text-center transition-all active:scale-95"
              >
                🩺 Clinician Demo<br /><span className="text-[10px] text-emerald-300/70 font-normal">Dr. Alex Mercer</span>
              </button>
            </div>
          </div>

          {/* Security & Compliance Footer */}
          <div className="flex items-center justify-center gap-4 mt-6 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-teal-500" /> ABDM Compliant</span>
            <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-emerald-500" /> HIPAA / HL7 Ready</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
