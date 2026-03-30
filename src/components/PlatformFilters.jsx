import React from 'react';

const PlatformFilters = React.memo(({
    isOpen,
    selectedGenre,
    setSelectedGenre,
    selectedLanguage,
    setSelectedLanguage = () => {},
    platformName,
    genres = [],
    languages = []
}) => {
    return (
        <div className={`filter-panel-wrapper ${isOpen ? 'filter-panel-wrapper--open' : ''}`}>
            <div className="filter-bar">
                <div className="filter-bar__grid">
                    <div>
                        <label htmlFor={`${platformName}-genreFilter`} className="filter-label">Genre</label>
                        <select
                            id={`${platformName}-genreFilter`}
                            value={selectedGenre}
                            onChange={(e) => setSelectedGenre(e.target.value)}
                            className="filter-select"
                        >
                            {genres.map(genre => <option key={genre} value={genre.toLowerCase()}>{genre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor={`${platformName}-languageFilter`} className="filter-label">Language</label>
                        <select
                            id={`${platformName}-languageFilter`}
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="filter-select"
                        >
                            {languages.map(lang => <option key={lang} value={lang.toLowerCase()}>{lang}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PlatformFilters;
