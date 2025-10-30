from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
from surprise import Dataset, Reader
import numpy as np
import random 

# --- Step 1: Import your custom recommendation functions ---
from recommender import content_based_recommendation, user_based_recommendation

# Initialize the Flask application
app = Flask(__name__)
CORS(app)

# --- Step 2: Load all your data and models when the server starts ---
print("Loading data and models...")
try:
    with open("ratings.pkl", 'rb') as file:
        ratings_df = pickle.load(file)
    with open("model.pkl", 'rb') as file:
        model = pickle.load(file)
    with open("database.pkl", 'rb') as file:
        database_df = pickle.load(file)
    print("All files loaded successfully.")
except FileNotFoundError as e:
    print(f"Error loading files: {e}. Make sure ratings.pkl, model.pkl, and database.pkl are in the 'backend' folder.")
    exit()

#Step 3: Pre-process data needed for the recommendation models ---
print("Pre-processing data for Surprise model...")
all_movie_ids = set(ratings_df['id'].unique())
reader = Reader(rating_scale=(1, 5))
data = Dataset.load_from_df(ratings_df[['userId', 'id', 'rating']], reader)
trainset = data.build_full_trainset()

raw_to_inner_iid_map = {trainset.to_raw_iid(inner_id): inner_id for inner_id in trainset.all_items()}

movie_factors = {
    movie_raw_id: model.qi[raw_to_inner_iid_map[movie_raw_id]]
    for movie_raw_id in all_movie_ids if movie_raw_id in raw_to_inner_iid_map
}
print("Pre-processing complete. Server is ready.")

# --- Step 4: Update the API endpoint to use your models ---
@app.route('/api/recommend', methods=['POST'])
def recommend():
    try:
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
        
        # --- FIX STARTS HERE ---
        # Randomly shuffle the final list to add variety to the recommendations.
        random.shuffle(final_recs)
        
        # Convert all numpy.int64 types to standard Python int types
        # before sending the JSON response.
        json_compatible_recs = [int(rec) for rec in final_recs]
        # --- FIX ENDS HERE ---

        print(f"Final hybrid recommendations sent to user: {json_compatible_recs}")
        
        # Pass the JSON-compatible list to jsonify
        return jsonify({"recommendations": json_compatible_recs})

    except Exception as e:
        print(f"An error occurred during recommendation: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
