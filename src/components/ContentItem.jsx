import React from 'react';

const ContentItem = React.memo(({ item, onClick }) => {
  const isVideo = item.type === 'youtube_video';

  return (
    <div
      className="content-card"
      onClick={() => onClick(item, 'details')}
      role="button"
      tabIndex="0"
      onKeyPress={(e) => e.key === 'Enter' && onClick(item, 'details')}
    >
      <img
        src={item.poster_url}
        alt={item.title}
        className={`content-card__image ${isVideo ? 'content-card__image--video' : 'content-card__image--poster'}`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://placehold.co/${isVideo ? '320x180' : '300x450'}/1a1a2e/ffffff?text=Error`;
        }}
      />
      <div className="content-card__body">
        <h3 className="content-card__title">{item.title}</h3>
        <p className="content-card__meta" title={item.genre}>Genre: {item.genre}</p>
        <p className="content-card__meta" title={item.cast}>Cast: {item.cast}</p>
        <p className="content-card__meta">Lang: {item.language}</p>
        <p className="content-card__meta">Year: {item.year}</p>
        {item.rating && <p className="content-card__rating">Rating: {item.rating}</p>}
      </div>
    </div>
  );
});

export default ContentItem;
