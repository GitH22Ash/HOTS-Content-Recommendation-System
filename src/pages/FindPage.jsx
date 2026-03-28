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
                switch(selectedContentType) {
                    case 'All Types': typeMatches = true; break;
                    case 'Movies': typeMatches = item.type === 'movie'; break;
                    case 'TV Shows': typeMatches = item.type === 'series'; break;
                    default: typeMatches = true;
                }
                return titleMatch && moodOrGenreMatch && languageMatch && typeMatches;
            });
    // FIX: Added 'moodToGenreMapping' to the dependency array to resolve the linter warning.
    }, [searchTerm, selectedGenre, selectedLanguage, selectedContentType, selectedMood, mockMovies, moodToGenreMapping]);

    return (
    <div className="p-4 md:p-8 text-white">
        <h1 className="text-3xl font-bold mb-6 flex items-center"><ListFilter size={28} className="mr-3"/> Find Content</h1>
        <div className="mb-6">
            <input type="search" placeholder="Search all content..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 outline-none"/>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div>
                <label htmlFor="moodFilter" className="flex items-center text-sm font-medium text-gray-300 mb-1">
                    <Sparkles size={14} className="mr-2 text-yellow-300"/> How are you feeling?
                </label>
                <select id="moodFilter" value={selectedMood} onChange={(e) => setSelectedMood(e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none appearance-none">
                    {moods.map(mood => <option key={mood} value={mood}>{mood}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="genreFilter" className="block text-sm font-medium text-gray-300 mb-1">Genre</label>
                <select id="genreFilter" value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} disabled={selectedMood !== 'Any Mood'} className="w-full p-2 bg-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed">
                    {genresForFilter.map(genre => <option key={genre} value={genre}>{genre}</option>)}
                </select>
                {selectedMood !== 'Any Mood' && <p className="text-xs text-red-400 mt-1">Genre is disabled when a mood is selected.</p>}
            </div>
            <div>
                <label htmlFor="contentTypeFilter" className="block text-sm font-medium text-gray-300 mb-1">Content Type</label>
                <select id="contentTypeFilter" value={selectedContentType} onChange={(e) => setSelectedContentType(e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none appearance-none">
                    {contentTypesList.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="languageFilter" className="block text-sm font-medium text-gray-300 mb-1">Language</label>
                <select id="languageFilter" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none appearance-none">
                    {languagesForFilter.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
            </div>
        </div>

        {filteredContent.length > 0 
            ? <ContentRow title={`Results (${filteredContent.length})`} items={filteredContent} onItemClick={onItemClick} /> 
            : <div className="text-center py-10">
                <XCircle size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-xl text-gray-400">No content found for the selected filters.</p>
              </div>
        }
    </div>);
});

export default FindPage;
