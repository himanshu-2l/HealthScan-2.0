import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    User,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { useToast } from '@/components/ui/use-toast';
import { seedDemoData } from '../services/demoDataSeeder';

export interface AppUser {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
}

interface AuthContextType {
    currentUser: User | AppUser | null;
    loading: boolean;
    isFirebaseConfigured: boolean;
    loginWithGoogle: () => Promise<void>;
    loginAsDemo: () => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const savedDemo = localStorage.getItem('healthscan_demo_user');
        if (savedDemo) {
            try {
                setCurrentUser(JSON.parse(savedDemo));
                setLoading(false);
                return;
            } catch (e) {
                localStorage.removeItem('healthscan_demo_user');
            }
        }

        if (isFirebaseConfigured && auth) {
            try {
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    // If not in demo mode, use Firebase user
                    if (!localStorage.getItem('healthscan_demo_user')) {
                        setCurrentUser(user);
                    }
                    setLoading(false);
                });
                return unsubscribe;
            } catch (err) {
                console.warn('Firebase auth listener skipped:', err);
            }
        }
        
        // Auto-provision demo session so hackathon judges & local testers never hit an auth wall
        const defaultUser: AppUser = {
            uid: 'demo-user-healthscan',
            displayName: 'Dr. Alex Mercer',
            email: 'alex.mercer@healthscan.io',
            photoURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&h=200&q=80'
        };
        localStorage.setItem('healthscan_demo_user', JSON.stringify(defaultUser));
        setCurrentUser(defaultUser);
        seedDemoData();
        setLoading(false);
    }, []);

    const loginAsDemo = () => {
        const demoUser: AppUser = {
            uid: 'demo-user-healthscan',
            displayName: 'Dr. Alex Mercer',
            email: 'alex.mercer@healthscan.io',
            photoURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&h=200&q=80'
        };
        localStorage.setItem('healthscan_demo_user', JSON.stringify(demoUser));
        setCurrentUser(demoUser);
        seedDemoData();
        toast({
            title: "Demo Mode Active",
            description: "Signed in as Dr. Alex Mercer. All features are unlocked!",
        });
    };

    const loginWithGoogle = async () => {
        if (!isFirebaseConfigured || !auth) {
            toast({
                variant: "destructive",
                title: "Firebase Google Auth Not Configured",
                description: "Firebase credentials not configured for this environment. Click 'Continue in Demo Mode' to explore all features immediately!",
            });
            return;
        }

        try {
            await signInWithPopup(auth, googleProvider);
            localStorage.removeItem('healthscan_demo_user');
            toast({
                title: "Welcome back!",
                description: "Successfully signed in with Google.",
            });
        } catch (error: any) {
            console.error("Login failed:", error);
            const isApiKeyError = error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid';
            toast({
                variant: "destructive",
                title: "Google Sign-In Failed",
                description: isApiKeyError
                    ? "Invalid Firebase API key in .env. Click 'Continue in Demo Mode' below to test the app without setting up Firebase!"
                    : (error.message || "Failed to sign in with Google."),
            });
        }
    };

    const logout = async () => {
        localStorage.removeItem('healthscan_demo_user');
        try {
            if (isFirebaseConfigured && auth) {
                await signOut(auth);
            }
        } catch (error: any) {
            console.error("Logout failed:", error);
        }
        setCurrentUser(null);
        toast({
            title: "Signed out",
            description: "You have been successfully signed out.",
        });
    };

    const value = {
        currentUser,
        loading,
        isFirebaseConfigured,
        loginWithGoogle,
        loginAsDemo,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
