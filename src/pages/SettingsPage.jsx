import React from 'react';
import { Settings, Clock, Heart } from 'lucide-react';

const SettingsPage = React.memo(({ viewHistory, currentUserId, userEmail }) => {
    return (
        <div className="page-content text-white">
            <h1 className="page-title"><Settings size={24} /> Settings</h1>
            <div className="bg-[var(--color-bg-card)] p-5 rounded-xl mb-6" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-subtle)' }}>
                <h2 className="text-xl font-semibold mb-3">Account Information</h2>
                {userEmail ? (<>
                    <p className="text-sm text-gray-300"><span className="font-semibold text-white">Email:</span> {userEmail}</p>
                    <p className="text-sm text-gray-300 mt-1"><span className="font-semibold text-white">User ID:</span> {currentUserId}</p>
                </>) : (
                    <p className="text-sm text-gray-400">Logged in as Guest. User ID: {currentUserId}</p>
                )}
                <p className="text-xs text-gray-600 mt-3">Powered by Supabase</p>
            </div>
            <div className="bg-[var(--color-bg-card)] p-5 rounded-xl" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-subtle)' }}>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Clock size={20} /> Watch History</h2>
                {viewHistory.length > 0 ? (
                    <ul className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2">
                        {viewHistory.map((entry, index) => (
                            <li key={`${entry.contentId}-${index}`} className="p-3 bg-[var(--color-bg-elevated)] rounded-lg flex justify-between items-center" style={{ border: '1px solid var(--color-border-subtle)' }}>
                                <div>
                                    <p className="font-semibold text-sm">{entry.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Action: {entry.action || 'viewed'}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Date: {entry.timestamp
                                            ? (typeof entry.timestamp === 'string'
                                                ? new Date(entry.timestamp).toLocaleString()
                                                : entry.timestamp.seconds
                                                    ? new Date(entry.timestamp.seconds * 1000).toLocaleString()
                                                    : 'N/A'
                                            )
                                            : 'N/A'}
                                    </p>
                                </div>
                                {entry.isLiked && <Heart className="text-red-500 fill-current flex-shrink-0" size={16} />}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-sm">No watch history available.</p>
                )}
            </div>
        </div>
    );
});

export default SettingsPage;
