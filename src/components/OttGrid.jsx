import React from 'react';

const OttGrid = React.memo(({ platforms, onPlatformClick }) => {
  if (!platforms || platforms.length === 0) return null;

  return (
    <div className="ott-grid">
      <h2 className="ott-grid__title">Your Apps &amp; Channels</h2>
      <div className="ott-grid__items">
        {platforms
          .filter(platform => platform && platform.id)
          .map((platform) => (
            <button
              key={platform.id}
              onClick={() => onPlatformClick(platform.page, platform.name)}
              className={`ott-grid__card ${platform.themeColor || 'bg-gray-700'}`}
              aria-label={`Open ${platform.name}`}
            >
              <img src={platform.logoUrl} alt={`${platform.name} logo`} />
            </button>
          ))}
      </div>
    </div>
  );
});

export default OttGrid;
