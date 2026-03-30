import React, { useRef, useEffect } from 'react';
import { PlayCircle, X } from 'lucide-react';
import gsap from 'gsap';

const Modal = React.memo(({ isOpen, onClose, title, children, selectedItem }) => {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen && overlayRef.current && panelRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );
      gsap.fromTo(panelRef.current,
        { scale: 0.92, opacity: 0, y: 16 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.4)', delay: 0.05 }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (overlayRef.current && panelRef.current) {
      gsap.to(panelRef.current, { scale: 0.92, opacity: 0, y: 16, duration: 0.2, ease: 'power2.in' });
      gsap.to(overlayRef.current, {
        opacity: 0, duration: 0.25, ease: 'power2.in', delay: 0.05,
        onComplete: onClose
      });
    } else {
      onClose();
    }
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={handleClose}>
      <div ref={panelRef} className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={handleClose} className="modal-panel__close" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <div className="text-gray-300">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{children}</p>
          {selectedItem && (
            <div className="mt-4 border-t border-gray-700/50 pt-4 space-y-1">
              <p className="text-sm text-gray-400"><b>Language:</b> {selectedItem.language || "N/A"}</p>
              <p className="text-sm text-gray-400"><b>Release:</b> {selectedItem.release_date || "N/A"}</p>
              <p className="text-sm text-gray-400"><b>Rating:</b> {selectedItem.rating || "N/A"}</p>
              <p className="text-sm text-gray-400"><b>Duration:</b> {selectedItem.duration || "N/A"}</p>
              <button
                onClick={() => alert(`This would start playing ${selectedItem.title}`)}
                className="btn btn--brand w-full mt-3"
              >
                <PlayCircle size={18} /> Play Movie
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Modal;
