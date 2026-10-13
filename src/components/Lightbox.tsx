'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface LightboxProps {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ photos, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, onClose]);

  const showNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const showPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const downloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `ncqc-gallery-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
      // Fallback
      window.open(url, '_blank');
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="lightbox-overlay active" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1000px' }}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close Lightbox" style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '3rem', cursor: 'pointer', zIndex: 10 }}>&times;</button>
      
      <div className="lightbox-content" style={{ position: 'relative', width: '100%', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', transformStyle: 'preserve-3d' }}>
        
        {/* Render Previous, Current, and Next images for 3D effect */}
        {photos.map((photo, index) => {
            let offset = index - currentIndex;
            // Handle wrap around
            if (offset < -1 && currentIndex === photos.length - 1 && index === 0) offset = 1;
            if (offset > 1 && currentIndex === 0 && index === photos.length - 1) offset = -1;
            
            if (Math.abs(offset) > 1) return null; // Only render immediate neighbors

            const isCenter = offset === 0;
            const translateX = offset * 60; // 60% translation
            const rotateY = offset * -45; // -45 deg rotation for left, 45 for right
            const scale = isCenter ? 1 : 0.7;
            const zIndex = isCenter ? 5 : 1;
            const opacity = isCenter ? 1 : 0.5;

            return (
                <div key={index} style={{ 
                    position: 'absolute', 
                    transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)', 
                    transform: `translateX(${translateX}%) translateZ(${isCenter ? '50px' : '-200px'}) rotateY(${rotateY}deg) scale(${scale})`, 
                    zIndex, 
                    opacity,
                    cursor: isCenter ? 'default' : 'pointer',
                    boxShadow: isCenter ? '0 30px 60px rgba(0,0,0,0.6)' : '0 10px 20px rgba(0,0,0,0.4)',
                    borderRadius: '16px',
                    overflow: 'hidden'
                }} onClick={() => {
                    if (offset === -1) showPrev();
                    if (offset === 1) showNext();
                }}>
                    <img src={photo} alt={`Gallery Image ${index + 1}`} style={{ height: '70vh', maxWidth: '80vw', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                </div>
            );
        })}

      </div>
      
      {/* Controls */}
      <div style={{ position: 'absolute', bottom: '5vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <button onClick={showPrev} aria-label="Previous Image" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '1.5rem', padding: '1rem', cursor: 'pointer', borderRadius: '50%', backdropFilter: 'blur(10px)', transition: 'background 0.3s' }}>&#10094;</button>
            <div className="lightbox-counter" style={{ color: '#fff', fontSize: '1.2rem', fontFamily: 'var(--font-primary)', letterSpacing: '0.1em', fontWeight: '600' }}>
                {currentIndex + 1} <span style={{ color: 'var(--red)' }}>/</span> {photos.length}
            </div>
            <button onClick={showNext} aria-label="Next Image" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '1.5rem', padding: '1rem', cursor: 'pointer', borderRadius: '50%', backdropFilter: 'blur(10px)', transition: 'background 0.3s' }}>&#10095;</button>
        </div>
        <button onClick={() => downloadImage(photos[currentIndex], currentIndex)} className="lightbox-download" aria-label="Download Image" style={{ background: 'var(--red)', border: 'none', color: '#fff', padding: '0.8rem 2rem', borderRadius: '100px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '0 10px 20px rgba(217,4,41,0.3)', transition: 'transform 0.3s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download HD
        </button>
      </div>
    </div>,
    document.body
  );
}
