import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Search, X, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { ottPlatforms, featuredContentDefault } from '../data/mockData';
import PlatformFilters from '../components/PlatformFilters';
import FeaturedSection from '../components/FeaturedSection';
import ContentRow from '../components/ContentRow';
import { getUniqueItems } from '../utils/helpers';
import gsap from 'gsap';

const GenericOttPage = React.memo(({ onItemClick, platformName, setCurrentPage, mockMovies }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState('all genres');
    const [selectedLanguage, setSelectedLanguage] = useState('all languages');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const searchInputRef = useRef(null);

    const genresForFilter = useMemo(() => ['All Genres', ...getUniqueItems(mockMovies, 'genre')], [mockMovies]);
    const languagesForFilter = useMemo(() => ['All Languages', ...getUniqueItems(mockMovies, 'language')], [mockMovies]);

    const platformDetails = useMemo(() => ottPlatforms.find(p => p.name === platformName) ||
        { name: platformName, themeColor: 'bg-gray-900', logoUrl: `https://placehold.co/150x50/222222/FFFFFF?text=${platformName.toUpperCase()}&font=Inter` }, [platformName]);

    const platformBaseMovies = useMemo(() => {
        if (!mockMovies) return [];
        return mockMovies.filter(m => m.ott?.includes(platformName));
    }, [mockMovies, platformName]);

    const filteredPlatformMovies = useMemo(() => {
        return platformBaseMovies.filter(item => {
            const titleMatch = !searchTerm || String(item.title).toLowerCase().includes(searchTerm.toLowerCase());
            const genreMatch = selectedGenre.toLowerCase() === 'all genres' || (item.genre && String(item.genre).toLowerCase().includes(selectedGenre.toLowerCase()));
            const languageMatch = selectedLanguage.toLowerCase() === 'all languages' || (item.language && String(item.language).toLowerCase() === selectedLanguage.toLowerCase());
            const categoryMatch = activeCategory === 'all' ||
                (activeCategory === 'movies' && item.type === 'movie') ||
                (activeCategory === 'series' && item.type === 'series');
            return titleMatch && genreMatch && languageMatch && categoryMatch;
        });
    }, [platformBaseMovies, searchTerm, selectedGenre, selectedLanguage, activeCategory]);

    const platformFeatured = useMemo(() => filteredPlatformMovies[0] || featuredContentDefault, [filteredPlatformMovies]);

    const platformOriginals = useMemo(() => filteredPlatformMovies.filter(m => (m.title?.toLowerCase().includes("original") || Math.random() < 0.2)).slice(0, 10), [filteredPlatformMovies]);
    const popularOnPlatform = useMemo(() => filteredPlatformMovies.filter(item => !platformOriginals.find(o => o.id === item.id)).slice(0, 10), [filteredPlatformMovies, platformOriginals]);
    const moreFromPlatform = useMemo(() => filteredPlatformMovies.filter(item => !platformOriginals.find(o => o.id === item.id) && !popularOnPlatform.find(p => p.id === item.id)).slice(0, 20), [filteredPlatformMovies, platformOriginals, popularOnPlatform]);

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
        <div className="min-h-screen text-white pt-[3.25rem]">
            {/* Fixed OTT Header */}
            <div className={`ott-header ${platformDetails.themeColor}`}>
                <img src={platformDetails.logoUrl} alt={`${platformName} Logo`} className="ott-header__logo" />

                {[{ label: 'All', key: 'all' }, { label: 'Movies', key: 'movies' }, { label: 'TV Shows', key: 'series' }].map(item => (
                    <button
                        key={item.key}
                        onClick={() => setActiveCategory(item.key)}
                        className={`ott-header__category-btn ${activeCategory === item.key ? 'ott-header__category-btn--active' : ''}`}
                    >
                        {item.label}
                    </button>
                ))}

                <div className="ott-header__actions">
                    <div className="ott-search-wrapper">
                        <input
                            ref={searchInputRef}
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={`Search ${platformName}...`}
                            className="ott-search-input"
                        />
                        <button onClick={toggleSearch} className="ott-search-toggle" aria-label="Toggle search">
                            {searchOpen ? <X size={14} /> : <Search size={14} />}
                        </button>
                    </div>
                    <button onClick={() => setFiltersOpen(!filtersOpen)} className={`ott-action-btn ${filtersOpen ? 'ott-action-btn--active' : ''}`}>
                        <SlidersHorizontal size={14} /> <span className="hidden sm:inline">Filters</span>
                    </button>
                    <button onClick={() => setCurrentPage('Home')} className="ott-back-btn">
                        <span className="flex items-center gap-1"><ArrowLeft size={14} /> Home</span>
                    </button>
                </div>
                <PlatformFilters
                    isOpen={filtersOpen}
                    selectedGenre={selectedGenre}
                    setSelectedGenre={setSelectedGenre}
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={setSelectedLanguage}
                    platformName={platformName}
                    genres={genresForFilter}
                    languages={languagesForFilter}
                />
            </div>

            {/* Content */}
            <div className="ott-page-body">
                <FeaturedSection item={platformFeatured} onItemClick={onItemClick} />
                <div style={{ padding: '0' }}>
                    {activeCategory === 'all' && (
                        <>
                            {platformOriginals.length > 0 && <ContentRow title={`${platformName} Originals`} items={platformOriginals} onItemClick={onItemClick} />}
                            {popularOnPlatform.length > 0 && <ContentRow title={`Popular on ${platformName}`} items={popularOnPlatform} onItemClick={onItemClick} />}
                            {moreFromPlatform.length > 0 && <ContentRow title={`More from ${platformName}`} items={moreFromPlatform} onItemClick={onItemClick} />}
                        </>
                    )}

                    {(activeCategory === 'movies' || activeCategory === 'series') && filteredPlatformMovies.length > 0 &&
                        <ContentRow title={`All ${activeCategory === 'movies' ? 'Movies' : 'TV Shows'} on ${platformName}`} items={filteredPlatformMovies} onItemClick={onItemClick} />
                    }

                    {filteredPlatformMovies.length === 0 &&
                        <p className="text-center text-gray-400 py-10 text-lg">No content matches your current filters on {platformName}.</p>
                    }
                </div>
            </div>
        </div>
    );
});

export default GenericOttPage;
