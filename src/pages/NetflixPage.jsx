import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import PlatformFilters from '../components/PlatformFilters';
import FeaturedSection from '../components/FeaturedSection';
import ContentRow from '../components/ContentRow';
import { featuredContentDefault } from '../data/mockData';
import { getUniqueItems } from '../utils/helpers';
import gsap from 'gsap';

const NetflixPage = React.memo(({ onItemClick, setCurrentPage, mockMovies }) => {
    const platformName = 'Netflix';
    const [searchTerm, setSearchTerm] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState('all genres');
    const [selectedLanguage, setSelectedLanguage] = useState('all languages');
    const searchInputRef = useRef(null);

    const genresForFilter = useMemo(() => ['All Genres', ...getUniqueItems(mockMovies, 'genre')], [mockMovies]);
    const languagesForFilter = useMemo(() => ['All Languages', ...getUniqueItems(mockMovies, 'language')], [mockMovies]);

    const platformBaseMovies = useMemo(() => {
        if (!mockMovies) return [];
        return mockMovies.filter(m => m.ott?.includes(platformName));
    }, [mockMovies]);

    const filteredPlatformMovies = useMemo(() => {
        return platformBaseMovies.filter(item => {
            const titleMatch = !searchTerm || String(item.title).toLowerCase().includes(searchTerm.toLowerCase());
            const genreMatch = selectedGenre.toLowerCase() === 'all genres' || (item.genre && String(item.genre).toLowerCase().includes(selectedGenre.toLowerCase()));
            const languageMatch = selectedLanguage.toLowerCase() === 'all languages' || (item.language && String(item.language).toLowerCase() === selectedLanguage.toLowerCase());
            return titleMatch && genreMatch && languageMatch;
        });
    }, [platformBaseMovies, searchTerm, selectedGenre, selectedLanguage]);

    const netflixFeatured = useMemo(() => filteredPlatformMovies.find(m => m.type === 'series') || filteredPlatformMovies[0] || featuredContentDefault, [filteredPlatformMovies]);

    const netflixOriginals = useMemo(() => {
        return filteredPlatformMovies.filter(m => {
            return (String(m.title).toLowerCase().includes('original') || Math.random() < 0.3);
        }).slice(0, 10);
    }, [filteredPlatformMovies]);

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
        <div className="bg-black min-h-screen text-white pt-[3.25rem]">
            {/* Fixed OTT Header */}
            <div className="ott-header bg-[#141414]">
                <img src="https://placehold.co/100x30/E50914/FFFFFF?text=NETFLIX&font=Inter" alt="Netflix Logo" className="ott-header__logo" />
                <div className="ott-header__actions">
                    <div className="ott-search-wrapper">
                        <input
                            ref={searchInputRef}
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search Netflix..."
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
                    selectedGenre={selectedGenre}
                    setSelectedGenre={setSelectedGenre}
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={setSelectedLanguage}
                    platformName={platformName}
                    genres={genresForFilter}
                    languages={languagesForFilter}
                />
                <FeaturedSection item={netflixFeatured} onItemClick={onItemClick} />
                <div style={{ padding: '0' }}>
                    {netflixOriginals.length > 0 && <ContentRow title="Netflix Originals" items={netflixOriginals} onItemClick={onItemClick} />}
                    {filteredPlatformMovies.length > 0 ?
                        <ContentRow title="All on Netflix" items={filteredPlatformMovies} onItemClick={onItemClick} />
                        : <p className="text-center text-gray-400 py-10 text-lg">No content matches your filters on Netflix.</p>
                    }
                </div>
            </div>
        </div>
    );
});

export default NetflixPage;
