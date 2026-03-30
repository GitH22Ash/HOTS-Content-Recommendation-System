import Papa from 'papaparse';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const platformNameMapping = {
  'netflix': 'Netflix', 'amazon prime video': 'Prime Video', 'prime video': 'Prime Video',
  'amazon': 'Prime Video', 'disney+': 'Disney+', 'disney plus': 'Disney+',
  'hotstar': 'Hotstar', 'youtube': 'YouTube',
};

const parseJsonString = (jsonString, keyToExtract = 'name', maxItems = 3) => {
    if (!jsonString || typeof jsonString !== 'string') return 'N/A';
    
    const trimmed = jsonString.trim();
    if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
        return jsonString;
    }

    try {
        const correctedJsonString = jsonString.replace(/'/g, '"');
        const items = JSON.parse(correctedJsonString);
        if (Array.isArray(items)) {
            return items.slice(0, maxItems).map(item => item[keyToExtract] || 'Unknown').filter(Boolean).join(', ') || 'N/A';
        }
    } catch (e) {
        console.warn(`Failed to parse JSON string: ${jsonString}`, e); 
    }
    return jsonString; 
};

const transformTmdbCsvRow = (csvRow) => {
  if (!csvRow || !csvRow.id || !csvRow.title) return null;

  const title = csvRow.title || 'Untitled';
  const platforms = (csvRow.platform || '').split(',')
      .map(p => { const trimmedP = p.trim().toLowerCase(); return platformNameMapping[trimmedP] || p.trim(); })
      .filter(Boolean);
  
  return {
    id: String(csvRow.id),
    title: title, 
    description: csvRow.overview || 'No description available.',
    year: csvRow.release_date ? new Date(csvRow.release_date).getFullYear() : 'N/A',
    release_date: csvRow.release_date || 'N/A', 
    genre: parseJsonString(csvRow.genres, 'name'), 
    cast: parseJsonString(csvRow.cast, 'name', 5), 
    language: csvRow.original_language || 'N/A',
    ott: platforms, 
    poster_url: csvRow.poster_path ? `${TMDB_IMAGE_BASE_URL}${csvRow.poster_path}` : `https://placehold.co/300x450/1a202c/ffffff?text=${encodeURIComponent(title.substring(0,10))}`,
    rating: csvRow.vote_average ? `${parseFloat(csvRow.vote_average).toFixed(1)}/10` : 'N/A',
    duration: csvRow.runtime ? `${csvRow.runtime} min` : 'N/A',
    type: csvRow.media_type === 'tv' || String(csvRow.title).toLowerCase().includes("series") || String(csvRow.overview).toLowerCase().includes("series") ? 'series' : 'movie', 
  };
};

export const getMovies = () => {
  return new Promise((resolve, reject) => {
    // Make sure  CSV file is named 'my_movies.csv' and is in the 'public' folder.
    const csvFilePath = '/my_movies.csv'; 

    Papa.parse(csvFilePath, {
      download: true,
      header: true,
      dynamicTyping: true,
      // FIX: This option tells PapaParse to ignore blank lines in the CSV file,
      // which prevents the "Too few fields" error.
      skipEmptyLines: true, 
      complete: (results) => {
        if (results.errors.length) {
          console.error("Errors parsing CSV:", results.errors);
          reject(new Error("Failed to parse CSV file."));
          return;
        }
        
        const transformedData = results.data
          .map(transformTmdbCsvRow)
          .filter(Boolean);

        resolve(transformedData);
      },
      error: (error) => {
        console.error("Could not fetch or parse CSV file:", error);
        reject(error);
      }
    });
  });
};

export const featuredContentDefault = {
  id: 'f1', title: 'Welcome to HOTS - Content Recommendation System', description: 'Explore a world of entertainment.',
  imageUrl: 'https://placehold.co/1280x720/1A202C/FFFFFF?text=HOTS+Home&fontsize=70',
  logoUrl: '/logo.png', type: 'feature'
};

export const mockLiveChannels = [ { id: 'live1', name: 'News Now', currentShow: 'Evening News Bulletin', genre: 'News', logo: 'https://placehold.co/100x60/FF6347/FFFFFF?text=News', type: 'live'} ];

export const ottPlatforms = [
  { id: 'netflix', name: 'Netflix', logoUrl: 'https://placehold.co/150x80/E50914/FFFFFF?text=NETFLIX&font=Inter', page: 'NetflixPage', themeColor: 'bg-red-700' },
  { id: 'prime', name: 'Prime Video', logoUrl: 'https://placehold.co/150x80/00A8E1/FFFFFF?text=Prime+Video&font=Inter', page: 'PrimePage', themeColor: 'bg-sky-600' },
  { id: 'youtube', name: 'YouTube', logoUrl: 'https://placehold.co/150x80/FF0000/FFFFFF?text=YouTube&font=Inter', page: 'YouTubePage', themeColor: 'bg-red-600' },
  { id: 'hulu', name: 'Hulu', logoUrl: 'https://placehold.co/150x80/1CE783/000000?text=hulu&font=Inter', page: 'HuluPage', themeColor: 'bg-green-500' },
  { id: 'disneyplus', name: 'Disney+', logoUrl: 'https://placehold.co/150x80/001E62/FFFFFF?text=Disney%2B&font=Inter', page: 'DisneyPlusPage', themeColor: 'bg-blue-800' },
  { id: 'hotstar', name: 'Hotstar', logoUrl: 'https://placehold.co/150x80/1822A9/FFFFFF?text=Hotstar&font=Inter', page: 'HotstarPage', themeColor: 'bg-indigo-700' },
];
