import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Search, X, ArrowLeft, Youtube, PlayCircle } from 'lucide-react';
import PlatformFilters from '../components/PlatformFilters';
import ContentRow from '../components/ContentRow';
import { getUniqueItems } from '../utils/helpers';
import gsap from 'gsap';

const YouTubePage = React.memo(({ onItemClick, setCurrentPage, mockMovies }) => {
    const platformName = 'YouTube';
    const [searchTerm, setSearchTerm] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all categories');
    const searchInputRef = useRef(null);

    const GLOBAL_GENRES = useMemo(() => ['All Genres', ...getUniqueItems(mockMovies, 'genre')], [mockMovies]);
    const GLOBAL_LANGUAGES = useMemo(() => ['All Languages', ...getUniqueItems(mockMovies, 'language')], [mockMovies]);

    const platformBaseMovies = useMemo(() => mockMovies.filter(m => m.type === 'youtube_video'), [mockMovies]);

    const filteredPlatformVideos = useMemo(() => {
        return platformBaseMovies.filter(item => {
            const titleMatch = !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase()) || (item.uploader && item.uploader.toLowerCase().includes(searchTerm.toLowerCase()));
            const categoryMatch = selectedCategory.toLowerCase() === 'all categories' || (item.genre && String(item.genre).toLowerCase().includes(selectedCategory.toLowerCase()));
            return titleMatch && categoryMatch;
        });
    }, [platformBaseMovies, searchTerm, selectedCategory]);

    const youtubeFeatured = useMemo(() => filteredPlatformVideos[0] || null, [filteredPlatformVideos]);

    const toggleSearch = useCallback(() => {
        if (searchOpen) {
            setSearchTerm('');
            if (searchInputRef.current) {
                gsap.to(searchInputRef.current, { width: 0, opacity: 0, padding: 0, duration: 0.35, ease: 'power2.inOut' });
            }
        } else {
            if (searchInputRef.current) {
                gsap.to(searchInputRef.current, { width: 220, opacity: 1, padding: '0.375rem 0.75rem', duration: 0.35, ease: 'power2.out',
                    onComplete: () => searchInputRef.current?.focus()
                });
            }
        }
        setSearchOpen(prev => !prev);
    }, [searchOpen]);

    return (
        <div className="bg-[#0f0f0f] min-h-screen text-white pt-[3.25rem]">
            {/* Fixed OTT Header */}
            <div className="ott-header bg-[#282828]">
                <div className="flex items-center gap-2">
                    <Youtube size={28} className="text-red-600" />
                    <span className="text-lg font-bold">YouTube</span>
                </div>
                <div className="ott-header__actions">
                    <div className="ott-search-wrapper">
                        <input
                            ref={searchInputRef}
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search YouTube..."
                            className="ott-search-input"
                        />
                        <button onClick={toggleSearch} className="ott-search-toggle" aria-label="Toggle search">
                            {searchOpen ? <X size={14} /> : <Search size={14} />}
                        </button>
                    </div>
                    <button onClick={() => setCurrentPage('Home')} className="ott-back-btn">
                        <span className="flex items-center gap-1"><ArrowLeft size={14} /> Home</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="ott-page-body">
                <PlatformFilters
                    selectedGenre={selectedCategory}
                    setSelectedGenre={setSelectedCategory}
                    selectedLanguage={"all languages"}
                    setSelectedLanguage={() => {}}
                    platformName={platformName}
                    genres={GLOBAL_GENRES}
                    languages={GLOBAL_LANGUAGES}
                />
                {youtubeFeatured && (
                    <div className="page-content">
                        <h2 className="text-2xl font-bold mb-4">{youtubeFeatured.title}</h2>
                        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 shadow-lg">
                            <img src={youtubeFeatured.poster_url?.replace('320x180', '1280x720')} alt={youtubeFeatured.title} className="w-full h-full object-cover" />
                        </div>
                        <button onClick={() => onItemClick(youtubeFeatured, 'play_video')} className="btn btn--brand">
                            <PlayCircle size={18} /> Watch Now
                        </button>
                    </div>
                )}
                <div style={{ padding: '0' }}>
                    {filteredPlatformVideos.length > 0 ?
                        <ContentRow title="Videos" items={filteredPlatformVideos} onItemClick={onItemClick} itemType="youtube" />
                        : <p className="text-center text-gray-400 py-10 text-lg">No videos match your filters on YouTube.</p>
                    }
                </div>
            </div>
        </div>
    );
});

export default YouTubePage;
