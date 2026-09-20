import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Activity, Loader2, Shield, Cpu, Lock } from 'lucide-react';

const Login: React.FC = () => {
    const { currentUser, loginWithGoogle, loginAsDemo, isFirebaseConfigured } = useAuth();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    if (currentUser) {
        return <Navigate to="/dashboard" />;
    }

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            await loginWithGoogle();
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center px-4">
            {/* Subtle ambient glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/[0.03] rounded-full blur-[120px]" />
            </div>

            {/* Main login card */}
            <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-10">
                    {/* Logo & Brand */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/20 mb-5">
                            <Activity className="w-7 h-7 text-teal-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Health<span className="text-teal-400">Scan</span>
                        </h1>
                        <p className="text-white/50 text-sm">
                            AI-powered health monitoring at your fingertips
                        </p>
                    </div>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 bg-white/[0.06] text-white/50 rounded-full px-3 py-1.5 text-xs">
                            <Cpu className="w-3 h-3" />
                            AI-Powered
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-white/[0.06] text-white/50 rounded-full px-3 py-1.5 text-xs">
                            <Shield className="w-3 h-3" />
                            ABDM Integrated
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-white/[0.06] text-white/50 rounded-full px-3 py-1.5 text-xs">
                            <Lock className="w-3 h-3" />
                            Privacy First
                        </span>
                    </div>

                    {/* Primary Google Sign-in & Demo Access */}
                    <div className="space-y-3">
                        <Button
                            type="button"
                            disabled={isGoogleLoading}
                            onClick={handleGoogleLogin}
                            className="w-full h-14 text-base font-medium bg-white hover:bg-white/90 text-gray-800 rounded-xl transition-all duration-200 shadow-lg shadow-white/5 hover:shadow-white/10"
                        >
                            {isGoogleLoading ? (
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            ) : (
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
                            {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                        </Button>

                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink mx-2 text-white/30 text-xs uppercase">or</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>

                        <Button
                            type="button"
                            onClick={loginAsDemo}
                            className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 shadow-md shadow-teal-500/20"
                        >
                            ⚡ Explore in Demo Mode (Instant Access)
                        </Button>

                        {!isFirebaseConfigured ? (
                            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200/90 leading-relaxed text-left">
                                <p className="font-semibold text-teal-300 flex items-center gap-1.5 mb-1">
                                    <span>💡</span> Local Dev Quick Start
                                </p>
                                <p>
                                    Firebase API keys are currently in placeholder mode. Click <strong>Explore in Demo Mode</strong> above to immediately test all health labs and dashboards without needing to set up Google Cloud/Firebase!
                                </p>
                            </div>
                        ) : (
                            <p className="text-center text-white/40 text-xs">
                                Secure authentication powered by Google & Firebase
                            </p>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/[0.06]" />
                        </div>
                    </div>

                    {/* Feature highlights */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                                <Activity className="w-4 h-4 text-teal-400" />
                            </div>
                            <div>
                                <p className="text-white/80 text-sm font-medium">Real-time Health Monitoring</p>
                                <p className="text-white/40 text-xs">Track vitals, analyze patterns, get insights</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-white/80 text-sm font-medium">ABDM Compliant</p>
                                <p className="text-white/40 text-xs">Integrated with Ayushman Bharat Digital Mission</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer links */}
                <div className="mt-6 text-center space-y-3">
                    <p className="text-white/40 text-xs">
                        By continuing, you agree to our{' '}
                        <Link to="/terms" className="text-white/60 hover:text-white transition-colors underline underline-offset-2">
                            Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-white/60 hover:text-white transition-colors underline underline-offset-2">
                            Privacy Policy
                        </Link>
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center text-white/50 hover:text-white/70 text-sm transition-colors"
                    >
                        Learn more about HealthScan →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
