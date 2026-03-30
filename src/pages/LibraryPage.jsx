import React from 'react';
import ContentRow from '../components/ContentRow';

const LibraryPage = React.memo(({ onItemClick, mockMovies }) => {
    if (!mockMovies || mockMovies.length === 0) {
        return <div className="page-content text-white opacity-60">Loading Library...</div>;
    }

    return (
        <div className="page-content text-white">
            <h1 className="page-title">My Library</h1>
            <ContentRow title="My Watchlist" items={mockMovies.slice(0, 5)} onItemClick={onItemClick} />
            <ContentRow title="Purchases & Rentals" items={mockMovies.slice(5, 10)} onItemClick={onItemClick} />
            <p className="text-gray-500 mt-6 text-sm">This page is a placeholder for your watchlist, purchases, and rentals. In a real app, this data would be fetched from your account.</p>
        </div>
    );
});

export default LibraryPage;
