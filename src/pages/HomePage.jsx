import React, { useMemo, useState, useEffect } from 'react';
import FeaturedSection from '../components/FeaturedSection';
import OttGrid from '../components/OttGrid';
import ContentRow from '../components/ContentRow';
import { ottPlatforms } from '../data/mockData';
import { getRecommendations } from '../services/recommendationService';

const HomePage = React.memo(({ viewHistory, onItemClick, featuredContent, onPlatformClick, mockMovies }) => {

    const [recommendedItems, setRecommendedItems] = useState([]);
    const [recommendationsLoading, setRecommendationsLoading] = useState(true);

    const recentlyWatchedItems = useMemo(() => {
        if (!viewHistory || viewHistory.length === 0 || !mockMovies || mockMovies.length === 0) return [];
        return viewHistory
            .filter(item => item && item.contentId)
            .map(historyItem => mockMovies.find(m => m.id === historyItem.contentId))
            .filter(Boolean)
            .reduce((unique, item) => {
                if (!unique.some(i => i.id === item.id)) {
                    unique.push(item);
                }
                return unique;
            }, [])
            .slice(0, 10);
    }, [viewHistory, mockMovies]);

    useEffect(() => {
        if (viewHistory.length > 0 && mockMovies.length > 0) {
            setRecommendationsLoading(true);
            const historyMovieIds = viewHistory.slice(0, 10).map(item => item.contentId).filter(Boolean);

            if (historyMovieIds.length > 0) {
                getRecommendations(historyMovieIds)
                    .then(response => {
                        const recommendedIds = response.data.recommendations || [];
                        const fullRecommendedItems = recommendedIds
                            .map(id => mockMovies.find(movie => movie.id === String(id)))
                            .filter(Boolean);
                        setRecommendedItems(fullRecommendedItems);
                    })
                    .catch(() => {
                        setRecommendedItems(mockMovies.slice(10, 20));
                    })
                    .finally(() => {
                        setRecommendationsLoading(false);
                    });
            } else {
                setRecommendedItems(mockMovies.slice(10, 20));
                setRecommendationsLoading(false);
            }
        } else if (mockMovies.length > 0) {
            setRecommendedItems(mockMovies.slice(10, 20));
            setRecommendationsLoading(false);
        }
    }, [viewHistory, mockMovies]);

    const contentRowData = useMemo(() => [
        ...(recentlyWatchedItems.length > 0 ? [{ name: 'Recently Watched', items: recentlyWatchedItems }] : []),
        { name: 'Recommended For You', items: recommendedItems, isLoading: recommendationsLoading },
        { name: 'New Release Movies', items: mockMovies.filter(m => m.year && parseInt(String(m.year)) >= 2023).slice(0, 10) },
        { name: 'Popular TV Series', items: mockMovies.filter(m => m.type === 'series').slice(0, 10) },
    ].filter(row => row.items && (row.items.length > 0 || row.isLoading)), [recentlyWatchedItems, recommendedItems, mockMovies, recommendationsLoading]);

    return (
        <>
            <FeaturedSection item={featuredContent} onItemClick={onItemClick} />
            <div style={{ paddingTop: 'var(--space-section-y)' }}>
                <OttGrid platforms={ottPlatforms} onPlatformClick={onPlatformClick} />
                {contentRowData.map((cat, index) => (
                    <ContentRow
                        key={`${cat.name}-${index}`}
                        title={cat.name}
                        items={cat.items}
                        onItemClick={onItemClick}
                        isLoading={cat.isLoading}
                    />
                ))}
            </div>
        </>
    );
});

export default HomePage;
