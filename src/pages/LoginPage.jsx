import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { UserPlus, LogIn, LogOut } from 'lucide-react';

const LoginPage = React.memo(({ setCurrentPage, showNotificationModal }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(true);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Check current user on mount
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

    // If user is already logged in (and not anonymously)
    if (currentUser) {
        return (
            <div className="min-h-[calc(100vh-150px)] flex flex-col items-center justify-center p-4 text-white">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-6 text-3xl font-bold shadow-lg shadow-red-500/20">
                    {(currentUser.email || 'U')[0].toUpperCase()}
                </div>
                <h1 className="text-3xl font-bold mb-4">Profile</h1>
                <p className="mb-2">Logged in as: {currentUser.email}</p>
                <p className="mb-6 text-sm text-gray-400">User ID: {currentUser.id}</p>
                <button onClick={handleSignOut} className="w-full max-w-xs bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                    <LogOut size={20} className="mr-2" /> Sign Out
                </button>
                <button onClick={() => setCurrentPage('Home')} className="mt-4 text-red-400 hover:text-red-300">
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-150px)] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-gray-700/50">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">{isSigningUp ? 'Create Account' : 'Welcome Back'}</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">Email</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-white bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" required />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-white bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" required />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-red-600/20 hover:shadow-red-600/40">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (isSigningUp ? <><UserPlus size={20} className="mr-2" />Sign Up</> : <><LogIn size={20} className="mr-2" />Login</>)}
                    </button>
                </form>
                <button onClick={() => setIsSigningUp(!isSigningUp)} className="mt-6 text-center w-full text-red-400 hover:text-red-300 text-sm transition-colors">
                    {isSigningUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                </button>
                <button onClick={() => setCurrentPage('Home')} className="mt-4 text-center w-full text-gray-400 hover:text-gray-300 text-sm transition-colors">Continue as Guest</button>
            </div>
        </div>
    );
});

export default LoginPage;
