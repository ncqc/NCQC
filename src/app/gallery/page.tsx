import Link from 'next/link';
import { getGalleryAlbums, getGalleryHeroImages } from '@/data/gallery';

export default async function GalleryPage() {
  const galleryData = await getGalleryAlbums();
  const heroImages = await getGalleryHeroImages();

  return (
    <section className="about-hero" style={{ paddingTop: '15rem', paddingBottom: '5rem' }}>
      <div className="container">
        <div className="reveal-text">
          <h1 className="page-title" style={{ textAlign: 'center', color: '#111', WebkitTextStroke: '0', fontFamily: 'var(--font-brutalist)' }}>Moments of Glory</h1>
        </div>
        <div className="about-content reveal-fade delay-1 is-visible">
          <p className="lead-text" style={{ color: '#475569', fontSize: '1.25rem', lineHeight: '1.6', textAlign: 'center', margin: '0 auto 4rem auto', maxWidth: '800px' }}>
            A visual journey through our greatest victories and cherished memories.
          </p>

          {/* Gallery Sneak Peek (3D Carousel Mini) */}
          <div className="gallery-wrapper reveal-fade up is-visible" style={{ transform: 'scale(0.8)', margin: '2rem 0 5rem 0' }}>
              <img src="/bar.png" alt="NCQC Center Logo" className="gallery-center-logo" />
              <div className="gallery-3d-container">
                  <div className="gallery-spinner">
                    {heroImages.slice(0, 6).map((img, index) => (
                      <div key={index} className="gallery-item" style={{ '--i': index + 1 } as React.CSSProperties}><img src={img} alt={`Gallery ${index}`} /></div>
                    ))}
                  </div>
              </div>
          </div>

          <div className="competitions-grid" style={{ marginTop: '3rem' }}>
            {galleryData.map((album) => (
              <div key={album.slug} className="comp-card reveal-fade up is-visible">
                <div className="comp-img-wrapper" style={{ height: '300px' }}>
                  <img src={album.coverImage} alt={album.title} className="comp-img" style={{ objectFit: album.coverImage.includes('logo') ? 'contain' : 'cover', padding: album.coverImage.includes('logo') ? '2rem' : '0' }} />
                </div>
                <div className="comp-info" style={{ textAlign: 'center' }}>
                  <h3 className="comp-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{album.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>{album.photos.length} Photos &bull; {album.date}</p>
                  <Link href={`/gallery/${album.slug}`} className="comp-btn-modern" style={{ display: 'inline-block' }}>
                    View Album &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
