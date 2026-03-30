import React, { useState, useMemo } from 'react';
import ContentRow from '../components/ContentRow';
import { getUniqueItems } from '../utils/helpers';
import { ListFilter, XCircle, Sparkles } from 'lucide-react';

const FindPage = React.memo(({ onItemClick, mockMovies }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('All Genres');
    const [selectedLanguage, setSelectedLanguage] = useState('All Languages');
    const [selectedContentType, setSelectedContentType] = useState('All Types');
    const [selectedMood, setSelectedMood] = useState('Any Mood');

    const contentTypesList = ['All Types', 'Movies', 'TV Shows'];

    const moods = [
        'Any Mood', 'Feeling Sad', 'Feeling Happy', 'Feeling Stressed',
        'Feeling Romantic', 'Feeling Adventurous', 'Feeling Nostalgic',
        'Feeling Bored', 'Feeling Scared'
    ];

    const moodToGenreMapping = useMemo(() => ({
        'feeling sad': ['comedy', 'drama', 'family'],
        'feeling happy': ['comedy', 'action', 'music'],
        'feeling stressed': ['comedy', 'family', 'fantasy', 'science fiction'],
        'feeling romantic': ['romance'],
        'feeling adventurous': ['action', 'adventure', 'fantasy', 'science fiction'],
        'feeling nostalgic': ['history', 'drama'],
        'feeling bored': ['thriller', 'mystery', 'action', 'adventure'],
        'feeling scared': ['comedy', 'animation', 'family']
    }), []);

    const genresForFilter = useMemo(() => ['All Genres', ...getUniqueItems(mockMovies, 'genre')], [mockMovies]);
    const languagesForFilter = useMemo(() => ['All Languages', ...getUniqueItems(mockMovies, 'language')], [mockMovies]);

    const filteredContent = useMemo(() => {
        if (!mockMovies) return [];

        const isMoodFilterActive = selectedMood.toLowerCase() !== 'any mood';
        const targetGenres = isMoodFilterActive ? moodToGenreMapping[selectedMood.toLowerCase()] : [];

        return mockMovies
            .filter(Boolean)
            .filter(item => {
                const titleMatch = !searchTerm || (item.title && String(item.title).toLowerCase().includes(searchTerm.toLowerCase())) || (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

                const moodOrGenreMatch = isMoodFilterActive
                    ? item.genre && targetGenres.some(targetGenre => String(item.genre).toLowerCase().includes(targetGenre))
                    : selectedGenre.toLowerCase() === 'all genres' || (item.genre && String(item.genre).toLowerCase().includes(selectedGenre.toLowerCase()));

                const languageMatch = selectedLanguage.toLowerCase() === 'all languages' || (item.language && String(item.language).toLowerCase() === selectedLanguage.toLowerCase());

                let typeMatches = false;
                switch (selectedContentType) {
                    case 'All Types': typeMatches = true; break;
                    case 'Movies': typeMatches = item.type === 'movie'; break;
                    case 'TV Shows': typeMatches = item.type === 'series'; break;
                    default: typeMatches = true;
                }
                return titleMatch && moodOrGenreMatch && languageMatch && typeMatches;
            });
    }, [searchTerm, selectedGenre, selectedLanguage, selectedContentType, selectedMood, mockMovies, moodToGenreMapping]);

    return (
        <div className="page-content text-white">
            <h1 className="page-title"><ListFilter size={24} /> Find Content</h1>
            <div className="mb-5">
                <input
                    type="search"
                    placeholder="Search all content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="filter-input"
                    style={{ fontSize: '0.9375rem', padding: '0.75rem 1rem' }}
                />
            </div>

            <div className="find-filters">
                <div>
                    <label htmlFor="moodFilter" className="filter-label flex items-center gap-1.5">
                        <Sparkles size={13} className="text-yellow-300" /> How are you feeling?
                    </label>
                    <select id="moodFilter" value={selectedMood} onChange={(e) => setSelectedMood(e.target.value)} className="filter-select">
                        {moods.map(mood => <option key={mood} value={mood}>{mood}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="genreFilter" className="filter-label">Genre</label>
                    <select id="genreFilter" value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} disabled={selectedMood !== 'Any Mood'} className="filter-select disabled:opacity-50 disabled:cursor-not-allowed">
                        {genresForFilter.map(genre => <option key={genre} value={genre}>{genre}</option>)}
                    </select>
                    {selectedMood !== 'Any Mood' && <p className="text-xs text-red-400 mt-1">Genre is disabled when a mood is selected.</p>}
                </div>
                <div>
                    <label htmlFor="contentTypeFilter" className="filter-label">Content Type</label>
                    <select id="contentTypeFilter" value={selectedContentType} onChange={(e) => setSelectedContentType(e.target.value)} className="filter-select">
                        {contentTypesList.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="languageFilter" className="filter-label">Language</label>
                    <select id="languageFilter" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="filter-select">
                        {languagesForFilter.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                </div>
            </div>

            {filteredContent.length > 0
                ? <ContentRow title={`Results (${filteredContent.length})`} items={filteredContent} onItemClick={onItemClick} />
                : <div className="text-center py-10">
                    <XCircle size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-lg text-gray-400">No content found for the selected filters.</p>
                </div>
            }
        </div>
    );
});

export default FindPage;
