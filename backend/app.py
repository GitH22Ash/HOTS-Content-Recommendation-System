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
    with open("model.pkl", 'rb') as file:
        model = pickle.load(file)
    with open("database.pkl", 'rb') as file:
        database_df = pickle.load(file)
    logger.info("All files loaded successfully.")
except FileNotFoundError as e:
    logger.error(f"Error loading files: {e}. Make sure ratings.pkl, model.pkl, and database.pkl are in the 'backend' folder.")
    # Don't exit — let the health check report the error
    ratings_df = None
    model = None
    database_df = None

# Step 3: Pre-process data needed for the recommendation models ---
if ratings_df is not None and model is not None:
    logger.info("Pre-processing data for Surprise model...")
    from surprise import Dataset, Reader
    all_movie_ids = set(ratings_df['id'].unique())
    reader = Reader(rating_scale=(1, 5))
    data = Dataset.load_from_df(ratings_df[['userId', 'id', 'rating']], reader)
    trainset = data.build_full_trainset()

    raw_to_inner_iid_map = {trainset.to_raw_iid(inner_id): inner_id for inner_id in trainset.all_items()}

    movie_factors = {
        movie_raw_id: model.qi[raw_to_inner_iid_map[movie_raw_id]]
        for movie_raw_id in all_movie_ids if movie_raw_id in raw_to_inner_iid_map
    }
    logger.info("Pre-processing complete. Server is ready.")
else:
    all_movie_ids = set()
    raw_to_inner_iid_map = {}
    movie_factors = {}
    logger.warning("Models not loaded. Recommendation endpoints will return errors.")


# --- Health Check Endpoint ---
@app.route('/api/health', methods=['GET'])
def health_check():
    models_loaded = ratings_df is not None and model is not None and database_df is not None
    return jsonify({
        "status": "healthy" if models_loaded else "degraded",
        "models_loaded": models_loaded,
        "total_movies": len(all_movie_ids),
        "message": "Fire TV Recommendation API is running"
    }), 200 if models_loaded else 503


# --- Recommendation Endpoint ---
@app.route('/api/recommend', methods=['POST'])
def recommend():
    try:
        if database_df is None or model is None:
            return jsonify({"error": "Models not loaded"}), 503

        data = request.get_json()
        if not data or 'movie_ids' not in data:
            return jsonify({"error": "Missing 'movie_ids' in request body"}), 400

        user_history_ids = [int(mid) for mid in data['movie_ids']]

        # --- Generate recommendations from both models ---
        last_watched_id = user_history_ids[0]
        content_recs = content_based_recommendation(last_watched_id, database_df, top_n=5)
        user_recs = user_based_recommendation(
            user_history_ids, model, all_movie_ids, movie_factors, raw_to_inner_iid_map, top_n=5
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


# --- TMDB Trailer Proxy Endpoint ---
@app.route('/api/trailers/<int:movie_id>', methods=['GET'])
def get_trailers(movie_id):
    """
    Proxy endpoint to fetch movie trailers from TMDB API.
    This avoids exposing the TMDB API key on the client side.
    """
    try:
        tmdb_api_key = os.environ.get('TMDB_API_KEY')
        if not tmdb_api_key:
            return jsonify({"error": "TMDB API key not configured", "videos": []}), 200

        url = f"https://api.themoviedb.org/3/movie/{movie_id}/videos"
        params = {"api_key": tmdb_api_key, "language": "en-US"}

        response = requests.get(url, params=params, timeout=5)

        if response.status_code == 200:
            data = response.json()
            # Filter for YouTube trailers only
            trailers = [
                {
                    "key": video["key"],
                    "name": video.get("name", "Trailer"),
                    "type": video.get("type", "Trailer"),
                    "site": video.get("site", "YouTube"),
                }
                for video in data.get("results", [])
                if video.get("site") == "YouTube" and video.get("type") in ["Trailer", "Teaser"]
            ]
            return jsonify({"videos": trailers, "movie_id": movie_id})
        else:
            logger.warning(f"TMDB API returned {response.status_code} for movie {movie_id}")
            return jsonify({"videos": [], "movie_id": movie_id})

    except requests.Timeout:
        logger.warning(f"TMDB API timeout for movie {movie_id}")
        return jsonify({"videos": [], "movie_id": movie_id})
    except Exception as e:
        logger.error(f"Error fetching trailers for movie {movie_id}: {e}")
        return jsonify({"videos": [], "movie_id": movie_id})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
