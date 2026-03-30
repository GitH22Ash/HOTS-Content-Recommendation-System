import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import random
import requests

# --- Step 1: Import your custom recommendation functions ---
from recommender import content_based_recommendation, user_based_recommendation, get_trending_movies

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the Flask application
app = Flask(__name__)

# --- CORS Configuration ---
# In production, restrict to your Vercel frontend URL.
# In development, allow localhost.
allowed_origins = os.environ.get(
    'ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173'
).split(',')

CORS(app, origins=[origin.strip() for origin in allowed_origins])

# --- Step 2: Load all your data and models when the server starts ---
logger.info("Loading data and models...")
try:
    with open("ratings.pkl", 'rb') as file:
        ratings_df = pickle.load(file)
    with open("database.pkl", 'rb') as file:
        database_df = pickle.load(file)

    # Load pre-processed model data (no scikit-surprise needed!)
    with open("model_processed.pkl", 'rb') as file:
        model_data = pickle.load(file)

    all_movie_ids = model_data['all_movie_ids']
    raw_to_inner_iid_map = model_data['raw_to_inner_iid_map']
    movie_factors = model_data['movie_factors']
    model_qi = model_data['qi']
    model_n_factors = model_data['n_factors']

    logger.info(f"All files loaded successfully. {len(all_movie_ids)} movies, {model_n_factors} factors.")

except FileNotFoundError as e:
    logger.error(f"Error loading files: {e}.")
    ratings_df = None
    database_df = None
    model_data = None
    all_movie_ids = set()
    raw_to_inner_iid_map = {}
    movie_factors = {}
    model_qi = None
    model_n_factors = 0


# --- Health Check Endpoint ---
@app.route('/api/health', methods=['GET'])
def health_check():
    models_loaded = ratings_df is not None and database_df is not None and model_data is not None
    return jsonify({
        "status": "healthy" if models_loaded else "degraded",
        "models_loaded": models_loaded,
        "total_movies": len(all_movie_ids),
        "message": "HOTS Recommendation API is running"
    }), 200 if models_loaded else 503


# --- Recommendation Endpoint ---
@app.route('/api/recommend', methods=['POST'])
def recommend():
    try:
        if database_df is None or model_data is None:
            return jsonify({"error": "Models not loaded"}), 503

        data = request.get_json()
        if not data or 'movie_ids' not in data:
            return jsonify({"error": "Missing 'movie_ids' in request body"}), 400

        user_history_ids = [int(mid) for mid in data['movie_ids']]

        # --- Generate recommendations from both models ---
        last_watched_id = user_history_ids[0]
        content_recs = content_based_recommendation(last_watched_id, database_df, top_n=5)
        user_recs = user_based_recommendation(
            user_history_ids, all_movie_ids, movie_factors, model_qi,
            raw_to_inner_iid_map, model_n_factors, top_n=5
        )

        combined_recs = list(dict.fromkeys(content_recs + user_recs))
        final_recs = [rec for rec in combined_recs if rec not in user_history_ids]

        # Randomly shuffle the final list to add variety
        random.shuffle(final_recs)

        # Convert all numpy.int64 types to standard Python int types
        json_compatible_recs = [int(rec) for rec in final_recs]

        logger.info(f"Hybrid recommendations sent: {json_compatible_recs[:10]}")

        return jsonify({"recommendations": json_compatible_recs})

    except Exception as e:
        logger.error(f"Error during recommendation: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred"}), 500


# --- Trending Endpoint (Cold-Start Fallback) ---
@app.route('/api/trending', methods=['GET'])
def trending():
    try:
        if database_df is None:
            return jsonify({"error": "Database not loaded"}), 503

        trending_ids = get_trending_movies(database_df, ratings_df, top_n=20)
        json_compatible_ids = [int(mid) for mid in trending_ids]

        return jsonify({"trending": json_compatible_ids})
    except Exception as e:
        logger.error(f"Error fetching trending: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred"}), 500


# --- YouTube Search Trailer Endpoint (zero extra dependencies) ---
import re
import urllib.parse

# In-memory cache to avoid repeated YouTube searches
_trailer_cache = {}

def _search_youtube(query, max_retries=2):
    """
    Search YouTube using a plain HTTP GET request and extract video IDs
    from the HTML response via regex. No API key or extra package needed.
    """
    encoded_query = urllib.parse.quote_plus(query)
    url = f"https://www.youtube.com/results?search_query={encoded_query}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }

    for attempt in range(max_retries):
        try:
            resp = requests.get(url, headers=headers, timeout=8)
            if resp.status_code == 200:
                # YouTube embeds video IDs in the HTML as /watch?v=VIDEO_ID
                video_ids = re.findall(r'watch\?v=([a-zA-Z0-9_-]{11})', resp.text)
                # De-duplicate while preserving order
                seen = set()
                unique_ids = []
                for vid in video_ids:
                    if vid not in seen:
                        seen.add(vid)
                        unique_ids.append(vid)
                return unique_ids[:5]  # Return top 5 unique results
        except Exception as e:
            logger.warning(f"YouTube search attempt {attempt+1} failed: {e}")
    return []


@app.route('/api/trailers/<int:movie_id>', methods=['GET'])
def get_trailers(movie_id):
    """
    Fetch a movie trailer from YouTube by searching for the movie title.
    Uses only the requests library (already installed) — no TMDB, no extra packages.
    """
    try:
        # Check cache first
        if movie_id in _trailer_cache:
            return jsonify({"videos": _trailer_cache[movie_id], "movie_id": movie_id})

        if database_df is None:
            return jsonify({"error": "Database not loaded", "videos": []}), 503

        # Lookup the movie title from the loaded dataset
        matches = database_df[database_df['id'].astype(str) == str(movie_id)]

        if matches.empty:
            logger.warning(f"Movie ID {movie_id} not found in local database.")
            return jsonify({"error": "Movie not found", "videos": []}), 404

        movie_title = matches.iloc[0]['title']
        search_query = f"{movie_title} Official Trailer"

        logger.info(f"Searching YouTube for: {search_query}")
        video_ids = _search_youtube(search_query)

        if not video_ids:
            logger.warning(f"No YouTube results for '{search_query}'.")
            _trailer_cache[movie_id] = []
            return jsonify({"videos": [], "movie_id": movie_id})

        # Build response matching the schema the React frontend expects
        trailers = [{
            "key": video_ids[0],
            "name": f"{movie_title} - Official Trailer",
            "type": "Trailer",
            "site": "YouTube"
        }]

        # Cache the result
        _trailer_cache[movie_id] = trailers
        logger.info(f"Found trailer for '{movie_title}': {video_ids[0]}")

        return jsonify({"videos": trailers, "movie_id": movie_id})

    except Exception as e:
        logger.error(f"Error fetching YouTube trailers for {movie_id}: {e}", exc_info=True)
        return jsonify({"videos": [], "movie_id": movie_id})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
