import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)


# --- Function 1: Content-Based Recommendations (Enhanced) ---
def content_based_recommendation(movie_id, new_df, top_n=5):
    """
    Generates content-based recommendations for a given movie ID.
    Enhanced with popularity weighting and better error handling.
    """
    logger.info(f"Generating content-based recommendations for movie_id: {movie_id}")

    # Find the row for the target movie
    index_series = new_df.loc[new_df["id"] == movie_id]

    if index_series.empty:
        logger.warning(f"Movie with ID {movie_id} not found in the database.")
        return []

    index = index_series.index[0]

    try:
        # Calculate overview similarity
        target_vector_overview = np.array(new_df.loc[index, 'overview_embedding']).reshape(1, -1)
        new_df['overview_similarity'] = new_df['overview_embedding'].apply(
            lambda x: cosine_similarity(np.array(x).reshape(1, -1), target_vector_overview)[0][0]
        )
    except Exception as e:
        logger.warning(f"Could not compute overview similarity: {e}")
        new_df['overview_similarity'] = 0.0

    try:
        # Calculate genres similarity
        target_vector_genres = np.array(new_df.loc[index, 'genres_embedding']).reshape(1, -1)
        new_df['genres_similarity'] = new_df['genres_embedding'].apply(
            lambda x: cosine_similarity(np.array(x).reshape(1, -1), target_vector_genres)[0][0]
        )
    except Exception as e:
        logger.warning(f"Could not compute genre similarity: {e}")
        new_df['genres_similarity'] = 0.0

    # Initialize production company similarity to zero
    new_df['production_companies_similarity'] = 0.0

    # Safely calculate production company similarity
    try:
        target_vector_prod_cos = np.array(new_df.loc[index, 'production_companies_companies']).reshape(1, -1)
        new_df['production_companies_similarity'] = new_df['production_companies_companies'].apply(
            lambda x: cosine_similarity(np.array(x).reshape(1, -1), target_vector_prod_cos)[0][0]
        )
    except KeyError:
        logger.info("'production_companies_companies' column not found. Skipping this feature.")
    except Exception as e:
        logger.warning(f"Could not calculate production company similarity: {e}")

    # --- Enhanced: Popularity normalization ---
    popularity_score = 0.0
    try:
        if 'vote_average' in new_df.columns:
            max_vote = new_df['vote_average'].max()
            if max_vote > 0:
                popularity_score = new_df['vote_average'] / max_vote
    except Exception:
        pass

    # Calculate the weighted average similarity score (enhanced weights)
    new_df['Movie_Similarity'] = (
        0.25 * new_df['genres_similarity'] +
        0.45 * new_df['overview_similarity'] +
        0.15 * new_df['production_companies_similarity'] +
        0.15 * popularity_score
    )

    # Get the top N most similar movies, excluding the movie itself
    top_recommendations = new_df.sort_values(by='Movie_Similarity', ascending=False)[1:top_n + 1]

    return top_recommendations['id'].tolist()


# --- Function 2: User-Based (Collaborative Filtering) Recommendations ---
def create_pseudo_user_vector(watched_movie_ids, movie_factors, n_factors):
    """
    Creates a weighted average vector representing the user's taste.
    More recent watches get higher weight (temporal recency).
    """
    pseudo_user_vector = np.zeros(n_factors)
    total_weight = 0

    for i, movie_id in enumerate(watched_movie_ids):
        if movie_id in movie_factors:
            weight = 1.0 / (1.0 + i * 0.1)
            pseudo_user_vector += movie_factors[movie_id] * weight
            total_weight += weight

    if total_weight > 0:
        return pseudo_user_vector / total_weight
    else:
        return np.zeros(n_factors)


def user_based_recommendation(watched_movie_ids, all_movie_ids, movie_factors,
                              model_qi, raw_to_inner_iid_map, n_factors, top_n=10):
    """
    Generates user-based recommendations using pre-extracted SVD factors.
    No scikit-surprise dependency needed — uses raw numpy arrays.
    """
    logger.info(f"Generating user-based recommendations for history: {watched_movie_ids[:5]}...")

    # Cold-start check
    if len(watched_movie_ids) < 2:
        logger.info("Too few watched items for collaborative filtering. Returning empty list.")
        return []

    pseudo_user_vector = create_pseudo_user_vector(watched_movie_ids, movie_factors, n_factors)

    movies_to_predict = all_movie_ids - set(watched_movie_ids)

    predictions = []
    for movie_id in movies_to_predict:
        if movie_id in raw_to_inner_iid_map:
            movie_inner_id = raw_to_inner_iid_map[movie_id]
            estimated_rating = np.dot(pseudo_user_vector, model_qi[movie_inner_id])
            predictions.append((movie_id, estimated_rating))

    predictions.sort(key=lambda x: x[1], reverse=True)

    # Take top candidates for diversity
    candidate_pool = predictions[:top_n * 3]
    recommended_movie_ids = [pred[0] for pred in candidate_pool[:top_n]]

    return recommended_movie_ids


# --- Function 3: Trending Movies (Cold-Start Fallback) ---
def get_trending_movies(database_df, ratings_df, top_n=20):
    """
    Returns trending/popular movies for users with no watch history.
    """
    logger.info("Generating trending movie list...")

    try:
        if ratings_df is not None and len(ratings_df) > 0:
            movie_stats = ratings_df.groupby('id').agg(
                avg_rating=('rating', 'mean'),
                num_ratings=('rating', 'count')
            ).reset_index()

            popular = movie_stats[movie_stats['num_ratings'] >= 3]
            popular = popular.copy()
            popular['trending_score'] = popular['avg_rating'] * np.log1p(popular['num_ratings'])
            popular = popular.sort_values('trending_score', ascending=False)

            trending_ids = popular.head(top_n)['id'].tolist()

            if len(trending_ids) >= top_n:
                return trending_ids

        if database_df is not None and len(database_df) > 0:
            return database_df.head(top_n)['id'].tolist()

        return []

    except Exception as e:
        logger.error(f"Error getting trending movies: {e}")
        if database_df is not None and len(database_df) > 0:
            return database_df.head(top_n)['id'].tolist()
        return []
