import React, { useRef, useEffect } from 'react';
import { PlayCircle, Info } from 'lucide-react';
import gsap from 'gsap';

const FeaturedSection = React.memo(({ item, onItemClick }) => {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power2.out', delay: 0.2 }
      );
    }
  }, [item]);

  if (!item) return <div className="featured-section flex items-center justify-center text-white">Loading featured content...</div>;

  return (
    <div
      ref={sectionRef}
      className="featured-section"
      style={{ backgroundImage: `url(${item.poster_url || item.imageUrl})` }}
      role="banner"
      onClick={() => onItemClick(item, 'details')}
      tabIndex="0"
      onKeyPress={(e) => e.key === 'Enter' && onItemClick(item, 'details')}
    >
      <div className="featured-section__gradient-b"></div>
      <div className="featured-section__gradient-l"></div>
      <div ref={contentRef} className="featured-section__content">
        {item.logoUrl && <img src={item.logoUrl} alt={`${item.title} logo`} className="w-32 md:w-48 mb-4 h-auto" onError={(e) => e.target.style.display = 'none'} />}
        <h1 className="featured-section__title">{item.title}</h1>
        <p className="featured-section__desc">{item.description}</p>
        <div className="flex gap-3">
          <button onClick={(e) => { e.stopPropagation(); onItemClick(item, 'play'); }} className="btn btn--primary" aria-label={`Play ${item.title}`}>
            <PlayCircle size={18} /> Play
          </button>
          <button onClick={(e) => { e.stopPropagation(); onItemClick(item, 'details'); }} className="btn btn--secondary" aria-label={`More info about ${item.title}`}>
            <Info size={18} /> More Info
          </button>
        </div>
      </div>
    </div>
  );
});

export default FeaturedSection;
