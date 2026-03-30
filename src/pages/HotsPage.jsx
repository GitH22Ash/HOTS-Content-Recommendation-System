import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Flame } from 'lucide-react';
import TrailerCard from '../components/TrailerCard';
import { getTrailers } from '../services/recommendationService';

const HotsPage = React.memo(({ onItemClick, handleInteraction, setCurrentPage, likedItems, mockMovies }) => {
    const [shuffledMovies, setShuffledMovies] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [trailerCache, setTrailerCache] = useState({}); // { movieId: youtubeKey }
    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const cardRefs = useRef({});

    // Shuffle and prepare movies on mount
    useEffect(() => {
        if (mockMovies && mockMovies.length > 0) {
            const shuffled = [...mockMovies]
                .sort(() => Math.random() - 0.5)
                .slice(0, 50);
            setShuffledMovies(shuffled);
        }
    }, [mockMovies]);

    // Fetch trailers for visible movies (lazy load)
    const fetchTrailer = useCallback(async (movieId) => {
        if (trailerCache[movieId] !== undefined) return; // Already fetched or fetching

        // Mark as fetching (null = loading, false = no trailer, string = key)
        setTrailerCache(prev => ({ ...prev, [movieId]: null }));

        try {
            const response = await getTrailers(movieId);
            const videos = response.data?.videos || [];
            const trailer = videos.find(v => v.type === 'Trailer') || videos[0];

            if (trailer?.key) {
                setTrailerCache(prev => ({
                    ...prev,
                    [movieId]: trailer.key,
                }));
            } else {
                // Fallback: use YouTube search embed with the movie title
                const movie = shuffledMovies.find(m => String(m.id) === String(movieId));
                if (movie) {
                    const searchQuery = encodeURIComponent(`${movie.title} Official Trailer`);
                    // YouTube supports embedding search results via a special URL
                    setTrailerCache(prev => ({
                        ...prev,
                        [movieId]: `SEARCH:${searchQuery}`,
                    }));
                } else {
                    setTrailerCache(prev => ({ ...prev, [movieId]: false }));
                }
            }
        } catch {
            // On error, also try the search fallback
            const movie = shuffledMovies.find(m => String(m.id) === String(movieId));
            if (movie) {
                const searchQuery = encodeURIComponent(`${movie.title} Official Trailer`);
                setTrailerCache(prev => ({
                    ...prev,
                    [movieId]: `SEARCH:${searchQuery}`,
                }));
            } else {
                setTrailerCache(prev => ({ ...prev, [movieId]: false }));
            }
        }
    }, [trailerCache, shuffledMovies]);

    // IntersectionObserver to detect active card
    useEffect(() => {
        if (shuffledMovies.length === 0) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.dataset.index, 10);
                        setActiveIndex(index);

                        // Pre-fetch trailers for current, next, and previous
                        const movie = shuffledMovies[index];
                        if (movie) fetchTrailer(movie.id);
                        if (shuffledMovies[index + 1]) fetchTrailer(shuffledMovies[index + 1].id);
                        if (shuffledMovies[index - 1]) fetchTrailer(shuffledMovies[index - 1].id);
                    }
                });
            },
            {
                threshold: 0.6, // Card is considered "active" when 60% visible
                root: containerRef.current,
            }
        );

        // Observe all card elements
        Object.values(cardRefs.current).forEach(ref => {
            if (ref) observerRef.current.observe(ref);
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [shuffledMovies, fetchTrailer]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setCurrentPage('Home');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setCurrentPage]);

    // Fetch initial trailer
    useEffect(() => {
        if (shuffledMovies.length > 0) {
            fetchTrailer(shuffledMovies[0].id);
            if (shuffledMovies[1]) fetchTrailer(shuffledMovies[1].id);
        }
    }, [shuffledMovies, fetchTrailer]);

    const handleLikeClick = useCallback((item) => {
        const isLiked = likedItems.has(item.id);
        handleInteraction(item, 'liked_hot', { isLiked: !isLiked });
    }, [likedItems, handleInteraction]);

    const handleCommentClick = useCallback((item) => {
        onItemClick(item, 'comment_hot');
    }, [onItemClick]);

    const handleInfoClick = useCallback((item) => {
        onItemClick(item, 'details');
    }, [onItemClick]);

    const handleShareClick = useCallback((item) => {
        // Share is handled internally in TrailerCard via Web Share API
        // This is a callback for fallback clipboard notification
        handleInteraction(item, 'shared_hot');
    }, [handleInteraction]);

    if (shuffledMovies.length === 0) {
        return (
            <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white">
                <Flame size={48} className="text-orange-500 animate-pulse mb-4" />
                <p className="text-xl font-medium">Loading Hots...</p>
                <p className="text-sm text-gray-500 mt-2">Preparing trending trailers</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory bg-black"
            style={{ scrollBehavior: 'smooth' }}
        >
            {/* Back button */}
            <button
                onClick={() => setCurrentPage('Home')}
                className="fixed top-4 left-4 z-20 flex items-center space-x-2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm hover:bg-black/80 transition-all border border-white/10"
            >
                <ArrowLeft size={16} />
                <span>Home</span>
            </button>

            {/* Hots logo */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5 pointer-events-none">
                <Flame size={20} className="text-orange-500" />
                <span className="text-white font-bold text-lg tracking-wide">HOTS</span>
            </div>

            {/* Progress indicator */}
            <div className="fixed top-4 right-4 z-20 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-300 border border-white/10">
                {activeIndex + 1} / {shuffledMovies.length}
            </div>

            {/* Movie trailer cards */}
            {shuffledMovies.map((item, index) => {
                const trailerKey = trailerCache[item.id];
                const isActive = index === activeIndex;

                return (
                    <div
                        key={item.id}
                        ref={el => { cardRefs.current[index] = el; }}
                        data-index={index}
                        className="snap-center"
                    >
                        <TrailerCard
                            item={item}
                            isActive={isActive}
                            isLiked={likedItems.has(item.id)}
                            trailerKey={typeof trailerKey === 'string' ? trailerKey : null}
                            onLike={handleLikeClick}
                            onComment={handleCommentClick}
                            onInfo={handleInfoClick}
                            onShare={handleShareClick}
                        />
                    </div>
                );
            })}
        </div>
    );
});

export default HotsPage;
