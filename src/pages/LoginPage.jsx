import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { UserPlus, LogIn, LogOut, Mail } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const LoginPage = React.memo(({ setCurrentPage, showNotificationModal }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(true);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    React.useEffect(() => {
        if (!isSupabaseConfigured()) return;
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && !user.is_anonymous) {
                setCurrentUser(user);
            }
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isSupabaseConfigured()) {
            showNotificationModal("Offline Mode", "Authentication is not configured. Running in guest mode.");
            return;
        }

        setLoading(true);
        try {
            let result;
            if (isSigningUp) {
                result = await supabase.auth.signUp({ email, password });
            } else {
                result = await supabase.auth.signInWithPassword({ email, password });
            }

            if (result.error) throw result.error;

            showNotificationModal("Success", `${isSigningUp ? 'Sign up' : 'Login'} successful!`);
            setCurrentPage('Home');
        } catch (error) {
            showNotificationModal("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (!isSupabaseConfigured()) {
            showNotificationModal("Offline Mode", "Authentication is not configured. Running in guest mode.");
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                }
            });
            if (error) throw error;
        } catch (error) {
            showNotificationModal("Error", error.message);
        }
    };

    const handleSignOut = async () => {
        if (!isSupabaseConfigured()) return;
        try {
            await supabase.auth.signOut();
            setCurrentUser(null);
            showNotificationModal("Signed Out", "You have been signed out successfully.");
        } catch (error) {
            showNotificationModal("Error", `Sign out error: ${error.message}`);
        }
    };

    // Logged-in state
    if (currentUser) {
        return (
            <div className="auth-wrapper">
                <div className="profile-avatar">
                    {(currentUser.email || 'U')[0].toUpperCase()}
                </div>
                <h1 className="text-2xl font-bold mb-4 text-white">Profile</h1>
                <p className="mb-2 text-gray-300">Logged in as: {currentUser.email}</p>
                <p className="mb-6 text-sm text-gray-500">User ID: {currentUser.id}</p>
                <button onClick={handleSignOut} className="btn btn--brand w-full max-w-xs">
                    <LogOut size={18} /> Sign Out
                </button>
                <button onClick={() => setCurrentPage('Home')} className="btn btn--ghost mt-4 text-red-400 hover:text-red-300">
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <h1 className="auth-card__title">{isSigningUp ? 'Create Account' : 'Welcome Back'}</h1>

                {/* Google OAuth Button */}
                <button onClick={handleGoogleSignIn} className="btn btn--google w-full mb-2">
                    <GoogleIcon />
                    Continue with Google
                </button>

                {/* Divider */}
                <div className="auth-divider">
                    <span>or continue with email</span>
                </div>

                {/* Email / Password Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="auth-label" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-input"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="mb-5">
                        <label className="auth-label" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn--brand w-full">
                        {loading ? (
                            <div className="spinner"></div>
                        ) : (isSigningUp ? <><UserPlus size={18} />Sign Up</> : <><LogIn size={18} />Login</>)}
                    </button>
                </form>
                <button onClick={() => setIsSigningUp(!isSigningUp)} className="mt-5 text-center w-full text-red-400 hover:text-red-300 text-sm transition-colors">
                    {isSigningUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                </button>
                <button onClick={() => setCurrentPage('Home')} className="mt-3 text-center w-full text-gray-500 hover:text-gray-400 text-sm transition-colors">Continue as Guest</button>
            </div>
        </div>
    );
});

export default LoginPage;
