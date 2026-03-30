import React from 'react';
import { mockLiveChannels } from '../data/mockData';

const LiveTVPage = React.memo(({ onItemClick }) => (
    <div className="page-content">
        <h1 className="page-title text-white">Live TV Channels</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockLiveChannels.map(channel => (
                <div
                    key={channel.id}
                    className="bg-[var(--color-bg-card)] p-4 rounded-xl cursor-pointer transition-all hover:bg-[var(--color-bg-elevated)] hover:shadow-lg hover:-translate-y-0.5"
                    style={{ boxShadow: 'var(--shadow-card)' }}
                    onClick={() => onItemClick({ ...channel, title: channel.name }, 'tune-in')}
                >
                    <img src={channel.logo} alt={`${channel.name} logo`} className="h-14 w-auto mb-3 rounded" />
                    <h3 className="text-lg font-semibold text-white mb-1">{channel.name}</h3>
                    <p className="text-sm text-gray-400">Now: {channel.currentShow}</p>
                    <p className="text-xs text-gray-500 mt-1">Genre: {channel.genre}</p>
                </div>
            ))}
        </div>
    </div>
));

export default LiveTVPage;
