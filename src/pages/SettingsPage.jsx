import React from 'react';
import { Settings, Clock, Heart } from 'lucide-react';

const SettingsPage = React.memo(({ viewHistory, currentUserId, userEmail }) => {
    return (
        <div className="p-4 md:p-8 text-white">
            <h1 className="text-3xl font-bold mb-6 flex items-center"><Settings size={28} className="mr-3" />Settings</h1>
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
                <h2 className="text-2xl font-semibold mb-4">Account Information</h2>
                {userEmail ? (<>
                    <p><span className="font-semibold">Email:</span> {userEmail}</p>
                    <p><span className="font-semibold">User ID:</span> {currentUserId}</p>
                </>) : (
                    <p>Logged in as Guest. User ID: {currentUserId}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">Powered by Supabase</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-semibold mb-4 flex items-center"><Clock size={24} className="mr-2" /> Watch History</h2>
                {viewHistory.length > 0 ? (
                    <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                        {viewHistory.map((entry, index) => (
                            <li key={`${entry.contentId}-${index}`} className="p-3 bg-gray-700 rounded-md shadow flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-lg">{entry.title}</p>
                                    <p className="text-sm text-gray-300">Action: {entry.action || 'viewed'}</p>
                                    <p className="text-xs text-gray-400 mt-1">
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
                                {entry.isLiked && <Heart className="text-red-500 fill-current" size={20} />}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-400">No watch history available.</p>
                )}
            </div>
        </div>
    );
});

export default SettingsPage;
