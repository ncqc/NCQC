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
          <h1 className="page-title" style={{ textAlign: 'center', color: '#111', WebkitTextStroke: '0', fontFamily: 'var(--font-brutalist)', fontSize: '2.5rem' }}>
            {album.title}
          </h1>
        </div>
        
        <div className="about-content">
          <p className="lead-text" style={{ color: '#475569', fontSize: '1.1rem', textAlign: 'center', margin: '1rem auto 2rem auto' }}>
            {album.date} &bull; {album.photos.length} Photos
          </p>

          <GalleryGrid photos={album.photos} />
        </div>
      </div>
    </section>
  );
}
