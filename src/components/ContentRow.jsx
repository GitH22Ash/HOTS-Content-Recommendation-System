import React, { useRef, useEffect } from 'react';
import ContentItem from './ContentItem';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';

const ContentRow = React.memo(({ title, items, onItemClick, isLoading = false, itemType = 'standard' }) => {
  const scrollRef = useRef(null);
  const rowRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!rowRef.current || hasAnimated.current || isLoading || !items || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            const cards = rowRef.current.querySelectorAll('.content-card');
            gsap.fromTo(cards,
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
            );
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, [items, isLoading]);

  if (isLoading) {
    return <div className="content-row page-content text-white opacity-60">Loading {title}...</div>;
  }
  if (!items || items.length === 0) return null;

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  return (
    <div ref={rowRef} className="content-row">
      <div className="content-row__header">
        <h2 className="content-row__title">{title}</h2>
        {items.length > 3 && (
          <div className="hidden md:flex gap-2">
            <button onClick={() => scroll('left')} className="content-row__nav-btn" aria-label={`Scroll left in ${title}`}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll('right')} className="content-row__nav-btn" aria-label={`Scroll right in ${title}`}>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
      <div ref={scrollRef} className="content-row__scroll scrollbar-hide">
        {items.map((item, index) =>
          <ContentItem
            key={`${item.id}-${title}-${index}`}
            item={item}
            onClick={onItemClick}
            itemType={item.type === 'youtube_video' ? 'youtube' : itemType}
          />
        )}
      </div>
    </div>
  );
});

export default ContentRow;
