'use client';
import { useState } from 'react';
import Lightbox from '@/components/Lightbox';

export default function GalleryGrid({ photos }: { photos: string[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className="album-grid" id="albumGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', margin: '3rem 0' }}>
        {photos.map((photo, index) => (
          <div key={index} className="album-item reveal-fade up is-visible" onClick={() => setLightboxIndex(index)} style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <img src={photo} alt={`Photo ${index + 1}`} style={{ width: '100%', height: '280px', objectFit: photo.includes('logo') ? 'contain' : 'cover', background: photo.includes('logo') ? '#fff' : 'transparent', transition: 'transform 0.5s ease' }} className="hover:scale-110" />
          </div>
        ))}
      </div>
      
      {lightboxIndex !== null && (
        <Lightbox 
          photos={photos} 
          initialIndex={lightboxIndex} 
          onClose={() => setLightboxIndex(null)} 
        />
      )}
    </>
  );
}
