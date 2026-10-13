'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Album } from '@/data/gallery';
import Link from 'next/link';

export default function GalleryAlbumEditor({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [album, setAlbum] = useState<Album | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Add multiple photo URL state
  const [bulkUrlInput, setBulkUrlInput] = useState('');

  useEffect(() => {
    params.then(async (resolvedParams) => {
      const res = await fetch(`/api/gallery?slug=${encodeURIComponent(resolvedParams.slug)}`);
      const json = await res.json();
        
      if (json.success && json.data) {
        setAlbum(json.data as Album);
      } else {
        setError('Album not found');
      }
    }).catch(err => {
      console.error(err);
      setError('Failed to load album');
    });
  }, [params]);

  const handleSave = async () => {
    if (!album) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ album })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save');
      alert('Album saved successfully!');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to save album.');
    }
    setIsSaving(false);
  };

  const updateField = (field: keyof Album, value: any) => {
    if (album) setAlbum({ ...album, [field]: value });
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        updateField('coverImage', data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Network error during upload');
    }
    setIsUploadingCover(false);
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhoto(true);
    
    const uploadedUrls: string[] = [];
    
    // Upload multiple files one by one
    for (let i = 0; i < files.length; i++) {
      try {
        const formData = new FormData();
        formData.append('file', files[i]);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        }
      } catch (err) {
        console.error('Error uploading file', i, err);
      }
    }
    
    if (uploadedUrls.length > 0) {
      const currentPhotos = album?.photos || [];
      updateField('photos', [...currentPhotos, ...uploadedUrls]);
    }
    
    setIsUploadingPhoto(false);
  };
  
  const handleAddBulkUrls = () => {
    if (!bulkUrlInput.trim()) return;
    const urls = bulkUrlInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    if (urls.length > 0) {
      const currentPhotos = album?.photos || [];
      updateField('photos', [...currentPhotos, ...urls]);
      setBulkUrlInput('');
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...(album?.photos || [])];
    newPhotos.splice(index, 1);
    updateField('photos', newPhotos);
  };

  const handleUpdatePhotoUrl = (index: number, newUrl: string) => {
    const newPhotos = [...(album?.photos || [])];
    newPhotos[index] = newUrl;
    updateField('photos', newPhotos);
  };

  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;
  if (!album) return <div className="p-10 text-center text-gray-500">Loading album...</div>;

  return (
    <div className="admin-gallery-editor-root" style={{ background: '#f3f4f6', minHeight: '100vh', padding: '1rem' }}>
      
      {/* Top Bar */}
      <div className="gallery-top-bar" style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '180px' }}>
          <Link href="/admin/gallery" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 'bold', background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>&larr; Back</Link>
          <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#111', fontWeight: 800 }}>Edit Album: {album.title}</h1>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: isSaving ? 'wait' : 'pointer', fontSize: '0.88rem', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)' }}
        >
          {isSaving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>

      <div className="gallery-editor-grid">
        
        {/* Photos Editor */}
        <div className="gallery-photos-card" style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#111827' }}>Album Photos ({album.photos?.length || 0})</h2>
            <label style={{ background: '#ef4444', color: '#fff', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              {isUploadingPhoto ? 'Uploading...' : '⬆️ Upload File(s)'}
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleUploadPhoto} disabled={isUploadingPhoto} />
            </label>
          </div>
          
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 'bold', color: '#374151' }}>Or Paste Image URLs (one per line):</p>
            <textarea 
              value={bulkUrlInput}
              onChange={(e) => setBulkUrlInput(e.target.value)}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              style={{ width: '100%', height: '80px', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '16px' }}
            />
            <button onClick={handleAddBulkUrls} style={{ background: '#111827', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
              Add URLs
            </button>
          </div>

          <div className="gallery-photos-flow">
            {album.photos?.map((photo, index) => (
              <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem', position: 'relative', background: '#f8fafc' }}>
                <img src={photo} alt={`Photo ${index}`} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.5rem' }} />
                <input 
                  type="text" 
                  value={photo} 
                  onChange={(e) => handleUpdatePhotoUrl(index, e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', fontSize: '16px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
                <button 
                  onClick={() => handleRemovePhoto(index)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239, 68, 68, 0.95)', color: '#fff', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                >
                  &times;
                </button>
              </div>
            ))}
            
            {(!album.photos || album.photos.length === 0) && (
              <p style={{ color: '#9ca3af', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem 0' }}>No photos added yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="gallery-sidebar-card" style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', color: '#111827' }}>Album Settings</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.3rem' }}>Album Title</label>
            <input 
              type="text" 
              value={album.title} 
              onChange={e => updateField('title', e.target.value)}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.3rem' }}>Date/Subtitle</label>
            <input 
              type="text" 
              value={album.date} 
              onChange={e => updateField('date', e.target.value)}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Cover Image</label>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '1rem', textAlign: 'center', background: '#f8fafc' }}>
              {album.coverImage && <img src={album.coverImage} alt="Cover" style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.75rem' }} />}
              <input 
                type="text" 
                value={album.coverImage} 
                onChange={e => updateField('coverImage', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', fontSize: '16px', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '0.5rem' }}
                placeholder="Or paste URL here"
              />
              <label style={{ display: 'inline-block', background: '#e2e8f0', color: '#334155', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold' }}>
                {isUploadingCover ? 'Uploading...' : '📁 Upload Image'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadCover} disabled={isUploadingCover} />
              </label>
            </div>
          </div>
          
        </div>
      </div>

      <style jsx global>{`
        .admin-gallery-editor-root {
          padding: 1.5rem !important;
        }
        .gallery-editor-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
        }
        .gallery-photos-flow {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .admin-gallery-editor-root {
            padding: 0.75rem !important;
          }
          .gallery-editor-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .gallery-top-bar {
            padding: 0.75rem 1rem !important;
            margin-bottom: 1rem !important;
          }
          .gallery-photos-flow {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}
