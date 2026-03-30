import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Info, Volume2, VolumeX, Play } from 'lucide-react';

const TrailerCard = React.memo(({ item, isActive, isLiked, trailerKey, onLike, onComment, onInfo, onShare }) => {
    const [isMuted, setIsMuted] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showPoster, setShowPoster] = useState(!trailerKey);
    const iframeRef = useRef(null);

    // Reset state when card becomes active/inactive
    useEffect(() => {
        if (!isActive) {
            setIsLoaded(false);
        }
    }, [isActive]);

    // Build YouTube embed URL with autoplay params
    const getYouTubeEmbedUrl = useCallback(() => {
        if (!trailerKey) return null;

        // Normal direct video ID embed
        const params = new URLSearchParams({
            autoplay: isActive ? '1' : '0',
            mute: isMuted ? '1' : '0',
            controls: '0',
            modestbranding: '1',
            rel: '0',
            showinfo: '0',
            loop: '1',
            playlist: trailerKey,
            playsinline: '1',
            enablejsapi: '1',
            origin: window.location.origin,
        });
        return `https://www.youtube-nocookie.com/embed/${trailerKey}?${params.toString()}`;
    }, [trailerKey, isActive, isMuted]);

    const handleShare = useCallback(() => {
        let shareUrl;
        if (trailerKey) {
            shareUrl = `https://www.youtube.com/watch?v=${trailerKey}`;
        } else {
            shareUrl = `Movie: ${item.title}`;
        }

        if (navigator.share) {
            navigator.share({
                title: item.title,
                text: `Check out the trailer for ${item.title}!`,
                url: shareUrl,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                onShare?.(item);
            }).catch(() => { });
        }
    }, [trailerKey, item, onShare]);

    const embedUrl = getYouTubeEmbedUrl();

    return (
        <div className="h-screen w-screen snap-center flex items-center justify-center relative bg-black overflow-hidden">
            {/* Background blur layer — shows poster behind the video */}
            <div
                className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-30"
                style={{ backgroundImage: `url(${item.poster_url})` }}
            />

            {/* Video / Poster area */}
            {embedUrl && isActive && !showPoster ? (
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    title={`${item.title} trailer`}
                    className="absolute inset-0 w-full h-full z-[1]"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    frameBorder="0"
                    onLoad={() => setIsLoaded(true)}
                    style={{ pointerEvents: 'none' }}
                />
            ) : (
                /* Poster fallback */
                <div className="absolute inset-0 flex items-center justify-center z-[1]">
                    <img
                        src={item.poster_url}
                        alt={String(item.title)}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => { e.target.src = 'https://placehold.co/800x1200/111827/ffffff?text=No+Trailer'; }}
                    />
                    {trailerKey && (
                        <button
                            onClick={() => setShowPoster(false)}
                            className="absolute z-10 bg-red-600/90 hover:bg-red-600 p-5 rounded-full transition-all transform hover:scale-110 shadow-2xl shadow-red-600/50"
                        >
                            <Play size={36} className="text-white ml-1" fill="white" />
                        </button>
                    )}
                    {!trailerKey && (
                        <div className="absolute bottom-32 left-0 right-0 text-center">
                            <p className="text-gray-400 text-sm bg-black/50 inline-block px-3 py-1 rounded-full">
                                Trailer not available
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Loading spinner */}
            {isActive && embedUrl && !isLoaded && !showPoster && (
                <div className="absolute inset-0 flex items-center justify-center z-[2] bg-black/50">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Bottom gradient overlay with movie info */}
            <div className="absolute bottom-0 left-0 w-full z-[3] pointer-events-none">
                <div className="bg-gradient-to-t from-black via-black/60 to-transparent p-5 pb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-1">
                        {String(item.title)}
                    </h2>
                    <div className="flex items-center space-x-3 text-sm text-gray-300">
                        {item.year && item.year !== 'N/A' && <span>{item.year}</span>}
                        {item.rating && item.rating !== 'N/A' && (
                            <span className="flex items-center text-yellow-400">
                                ★ {item.rating}
                            </span>
                        )}
                        {item.genre && item.genre !== 'N/A' && (
                            <span className="text-gray-400 truncate max-w-[200px]">{item.genre}</span>
                        )}
                    </div>
                    {item.description && (
                        <p className="text-sm text-gray-300 mt-2 line-clamp-2 max-w-lg">
                            {item.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Right sidebar — TikTok-style action buttons */}
            <div className="absolute right-3 md:right-5 bottom-36 flex flex-col items-center space-y-5 z-[4]">
                {/* Like */}
                <button
                    onClick={() => onLike(item)}
                    className="flex flex-col items-center group"
                >
                    <div className={`p-3 rounded-full backdrop-blur-sm transition-all ${isLiked
                        ? 'bg-red-500/30 scale-110'
                        : 'bg-white/10 hover:bg-white/20'
                        }`}>
                        <Heart
                            size={28}
                            className={`transition-all ${isLiked
                                ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                : 'text-white group-hover:scale-110'
                                }`}
                        />
                    </div>
                    <span className="text-xs mt-1 text-white/80">Like</span>
                </button>

                {/* Comment */}
                <button
                    onClick={() => onComment(item)}
                    className="flex flex-col items-center group"
                >
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                        <MessageCircle size={28} className="text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs mt-1 text-white/80">Comment</span>
                </button>

                {/* Share */}
                <button
                    onClick={handleShare}
                    className="flex flex-col items-center group"
                >
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                        <Share2 size={28} className="text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs mt-1 text-white/80">Share</span>
                </button>

                {/* Info */}
                <button
                    onClick={() => onInfo(item)}
                    className="flex flex-col items-center group"
                >
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                        <Info size={28} className="text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs mt-1 text-white/80">Info</span>
                </button>

                {/* Mute/Unmute */}
                {trailerKey && !showPoster && (
                    <button
                        onClick={() => setIsMuted(prev => !prev)}
                        className="flex flex-col items-center group"
                    >
                        <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                            {isMuted ? (
                                <VolumeX size={24} className="text-white" />
                            ) : (
                                <Volume2 size={24} className="text-white" />
                            )}
                        </div>
                        <span className="text-xs mt-1 text-white/80">{isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>
                )}
            </div>

            {/* Top-right — movie poster thumbnail */}
            <div className="absolute top-20 right-3 md:right-5 z-[4]">
                <img
                    src={item.poster_url}
                    alt={String(item.title)}
                    className="w-12 h-18 md:w-14 md:h-21 rounded-lg shadow-lg object-cover border border-white/20"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            </div>
        </div>
    );
});

export default TrailerCard;
