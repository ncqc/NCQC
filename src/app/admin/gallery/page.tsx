'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Album } from '@/data/gallery';
import Link from 'next/link';

export default function GalleryAdminGrid() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const router = require('next/navigation').useRouter();

  useEffect(() => {
    async function load() {
      // Load Albums
      const { data: albumData } = await supabase.from('gallery_album').select('*').order('date', { ascending: false });
      if (albumData) setAlbums(albumData as Album[]);

      // Load Hero Images
      const { data: heroData } = await supabase.from('gallery_hero').select('*').eq('id', 1).single();
      if (heroData && heroData.images) {
        setHeroImages(heroData.images as string[]);
      } else {
        setHeroImages([
          "https://picsum.photos/400/500?random=11",
          "https://picsum.photos/400/500?random=12",
          "https://picsum.photos/400/500?random=13",
          "https://picsum.photos/400/500?random=14",
          "https://picsum.photos/400/500?random=15",
          "https://picsum.photos/400/500?random=16"
        ]);
      }
    }
    load();
  }, []);

  const handleAddNewAlbum = async () => {
    setIsAdding(true);
    const newSlug = `new-album-${Date.now()}`;
    const newAlbum: Album = {
      slug: newSlug,
      title: 'New Gallery Album',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      coverImage: '/logo.png',
      photos: []
    };

    try {
      const { error } = await supabase.from('gallery_album').insert(newAlbum);
      if (error) throw error;
      router.push(`/admin/gallery/${newSlug}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create new album');
      setIsAdding(false);
    }
  };

  const handleDeleteAlbum = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this album?')) return;
    try {
      const { error } = await supabase.from('gallery_album').delete().eq('slug', slug);
      if (error) throw error;
      setAlbums(albums.filter(a => a.slug !== slug));
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete album');
    }
  };

  const handleSaveHeroImages = async () => {
    setIsSavingHero(true);
    try {
      const { error } = await supabase.from('gallery_hero').upsert({ id: 1, images: heroImages });
      if (error) throw error;
      alert('Hero images saved successfully!');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to save hero images');
    }
    setIsSavingHero(false);
  };

  const handleUpdateHeroImage = (index: number, url: string) => {
    const newImages = [...heroImages];
    newImages[index] = url;
    setHeroImages(newImages);
  };

  const handleUploadHeroImage = async (index: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        handleUpdateHeroImage(index, data.url);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Upload failed');
    }
  };

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '5rem', background: '#f3f4f6', minHeight: '100vh', padding: '2rem' }}>
      
      {/* Hero Images Editor */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', marginBottom: '4rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111' }}>Gallery Hero Animation Images</h2>
            <p style={{ color: '#64748b' }}>Edit the 6 rotating images at the top of the Gallery page.</p>
          </div>
          <button 
            onClick={handleSaveHeroImages} 
            disabled={isSavingHero}
            style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isSavingHero ? 'Saving...' : '💾 Save Hero Images'}
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {heroImages.slice(0, 6).map((img, idx) => (
            <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
              <img src={img} alt={`Hero ${idx + 1}`} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' }} />
              <input 
                type="text" 
                value={img} 
                onChange={(e) => handleUpdateHeroImage(idx, e.target.value)}
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', marginBottom: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="Image URL"
              />
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>
                Upload New File
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                  if (e.target.files?.[0]) handleUploadHeroImage(idx, e.target.files[0]);
                }} />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Albums Editor */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111' }}>Gallery Albums (Folders)</h2>
          <p style={{ color: '#64748b' }}>Manage your photo albums.</p>
        </div>
        <button 
          onClick={handleAddNewAlbum} 
          disabled={isAdding}
          style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: isAdding ? 'wait' : 'pointer' }}
        >
          {isAdding ? 'Creating...' : '➕ Add New Album'}
        </button>
      </div>

      <div className="competitions-grid">
        {albums.map((album) => (
          <div key={album.slug} className="comp-card" style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
            <div className="comp-img-wrapper" style={{ height: '200px' }}>
              <img src={album.coverImage} alt={album.title} className="comp-img" style={{ objectFit: album.coverImage.includes('logo') ? 'contain' : 'cover', padding: album.coverImage.includes('logo') ? '1rem' : '0' }} />
            </div>
            <div className="comp-info">
              <h3 className="comp-title" style={{ fontSize: '1.1rem' }}>{album.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>{album.date} • {album.photos?.length || 0} Photos</p>
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1rem' }}>
                <Link href={`/admin/gallery/${album.slug}`} className="comp-btn-modern" style={{ background: '#dc2626', color: '#fff', border: 'none', textAlign: 'center', flex: 1, padding: '0.6rem', fontSize: '0.9rem' }}>
                  ✏️ Edit Album
                </Link>
                <button 
                  onClick={() => handleDeleteAlbum(album.slug)}
                  style={{ background: '#f87171', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 0.8rem', cursor: 'pointer' }}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
