import { notFound } from 'next/navigation';
import { getAlbum, getGalleryAlbums } from '@/data/gallery';
import Link from 'next/link';
import GalleryGrid from '@/components/GalleryGrid';

export const revalidate = 60;

export async function generateStaticParams() {
  const albums = await getGalleryAlbums();
  return albums.map((album) => ({
    slug: album.slug,
  }));
}

export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const album = await getAlbum(resolvedParams.slug);

  if (!album) {
    notFound();
  }

  return (
    <section className="about-hero" style={{ paddingTop: '15rem', paddingBottom: '5rem' }}>
      <div className="container">
        <div className="reveal-text" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/gallery" className="comp-btn-modern" style={{ display: 'inline-block' }}>
            &larr; Back to Gallery
          </Link>
        </div>
        
        <div className="reveal-text">
          <h1 className="page-title" style={{ textAlign: 'center', color: '#111', WebkitTextStroke: '0', fontFamily: 'var(--font-super-mellow), "SuperMellow", sans-serif', fontSize: '2.5rem' }}>
            {album.title}
          </h1>
        </div>
        
        <div className="about-content">
          <div className="lead-pill-wrap" style={{ margin: '1rem 0 2rem 0' }}>
            <div className="lead-pill-badge">
              <span className="lead-pill-dot"></span>
              <span className="lead-pill-text">{album.date} &bull; {album.photos.length} Photos</span>
            </div>
          </div>

          <GalleryGrid photos={album.photos} />
        </div>
      </div>
    </section>
  );
}
