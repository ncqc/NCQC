'use client';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Project } from '@/data/projects';
import StyledFieldEditor from '@/components/StyledFieldEditor';

// Dynamically import ReactQuill and register formats
const ReactQuill = dynamic(async () => {
  const rq = await import('react-quill-new');
  const Quill = rq.default.Quill;
  
  // Register exact pixel sizes using inline styles
  const sizeWhitelist = ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px', '72px'];
  const Size = Quill.import('formats/size') as any;
  if (Size) {
    Size.whitelist = sizeWhitelist;
    Quill.register(Size, true);
  }
  const SizeStyle = Quill.import('attributors/style/size') as any;
  if (SizeStyle) {
    SizeStyle.whitelist = sizeWhitelist;
    Quill.register(SizeStyle, true);
    Quill.register({ 'formats/size': SizeStyle }, true);
  }

  const fontList = ['sans-serif', 'serif', 'monospace', 'inter', 'roboto', 'open-sans', 'montserrat', 'poppins', 'lato', 'oswald', 'raleway', 'playfair-display', 'merriweather', 'nunito', 'ubuntu', 'rubik', 'work-sans', 'lora', 'fira-sans', 'quicksand', 'barlow', 'mulish', 'pt-serif', 'mukta', 'nunito-sans', 'bebas-neue', 'anton', 'josefin-sans', 'dancing-script'];

  const FontClass = Quill.import('attributors/class/font') as any;
  if (FontClass) {
    FontClass.whitelist = fontList;
    Quill.register(FontClass, true);
    Quill.register({ 'formats/font': FontClass }, true);
  }

  const FontStyle = Quill.import('attributors/style/font') as any;
  if (FontStyle) {
    FontStyle.whitelist = fontList;
    Quill.register(FontStyle, true);
  }

  return rq.default;
}, { ssr: false, loading: () => <div className="p-10 text-center">Loading Word Editor...</div> });
import 'react-quill-new/dist/quill.snow.css';

export default function AdminProjectEditor({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [mobileTab, setMobileTab] = useState<'content' | 'settings'>('content');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(async (resolvedParams) => {
      const res = await fetch(`/api/projects?slug=${encodeURIComponent(resolvedParams.slug)}`);
      const json = await res.json();
        
      if (json.success && json.data) {
        setProject(json.data as Project);
      } else {
        setError('Project not found');
      }
    }).catch(err => {
      console.error(err);
      setError('Failed to load project');
    });
  }, [params]);

  // Extended Quill modules for FULL MS Word-like formatting (Exactly copied from achievements)
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'font': ['sans-serif', 'serif', 'monospace', 'inter', 'roboto', 'open-sans', 'montserrat', 'poppins', 'lato', 'oswald', 'raleway', 'playfair-display', 'merriweather', 'nunito', 'ubuntu', 'rubik', 'work-sans', 'lora', 'fira-sans', 'quicksand', 'barlow', 'mulish', 'pt-serif', 'mukta', 'nunito-sans', 'bebas-neue', 'anton', 'josefin-sans', 'dancing-script'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'size': ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px', '72px'] }],
        [{ 'color': [] }, { 'background': [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ]
    }
  }), []);

  const handleSave = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      const { id, ...dataToSave } = project as any;
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to save');
      alert('Changes saved successfully!');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to save changes.');
    }
    setIsSaving(false);
  };

  const updateField = (field: keyof Project, value: any) => {
    if (project) {
      setProject({ ...project, [field]: value });
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success && data.url) {
        updateField('image', data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('An error occurred while uploading.');
    }
    setIsUploading(false);
  };

  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;
  if (!project) return <div className="p-10 text-center">Loading editor...</div>;

  return (
    <div className="project-builder-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f3f4f6' }}>
      
      {/* MS Word-like Sticky Top Bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0.6rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => router.push('/admin/projects')}
            style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: '#111827' }}>Project Builder</h1>
            <p className="desktop-only-sub" style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Design the entire page content here.</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button 
            onClick={handleSave} disabled={isSaving}
            style={{
              background: '#ef4444', color: '#fff', border: 'none', padding: '0.55rem 1.4rem',
              borderRadius: '8px', fontWeight: 'bold', cursor: isSaving ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', fontSize: '0.85rem'
            }}
          >
            {isSaving ? 'Saving...' : '💾 Save'}
          </button>
        </div>
      </div>

      {/* Mobile Tab Segmented Switcher (Visible on Mobile only) */}
      <div className="mobile-editor-tabs">
        <button
          type="button"
          onClick={() => setMobileTab('content')}
          className={`mobile-tab-btn ${mobileTab === 'content' ? 'active' : ''}`}
        >
          📝 Document Canvas
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('settings')}
          className={`mobile-tab-btn ${mobileTab === 'settings' ? 'active' : ''}`}
        >
          ⚙️ Card & Details
        </button>
      </div>

      <style jsx global>{`
        /* Make Quill Toolbar look like MS Word Ribbon at the top */
        .page-builder-wrapper {
          display: flex;
          height: calc(100vh - 65px);
        }
        .page-builder-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #fff;
          position: relative;
        }
        .page-builder-sidebar {
          width: 350px;
          background: #f9fafb;
          border-left: 1px solid #e5e7eb;
          overflow-y: auto;
          padding: 1.5rem;
        }
        .mobile-editor-tabs {
          display: none;
        }
        @media (max-width: 900px) {
          .project-builder-root {
            height: auto !important;
            min-height: 100vh !important;
            overflow: visible !important;
          }
          .desktop-only-sub {
            display: none !important;
          }
          .mobile-editor-tabs {
            display: flex !important;
            background: #f1f5f9;
            padding: 0.35rem 0.5rem;
            border-bottom: 1px solid #cbd5e1;
            position: sticky;
            top: 56px;
            z-index: 999;
            gap: 0.35rem;
          }
          .mobile-tab-btn {
            flex: 1;
            padding: 0.5rem 0.75rem;
            border: none;
            background: transparent;
            border-radius: 8px;
            font-size: 0.82rem;
            font-weight: 700;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s;
          }
          .mobile-tab-btn.active {
            background: #ffffff;
            color: #ef4444;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          }
          .page-builder-main.hide-on-mobile,
          .page-builder-sidebar.hide-on-mobile {
            display: none !important;
          }
          .page-builder-sidebar {
            width: 100% !important;
            border-left: none !important;
            padding: 1rem !important;
          }
        }
        .quill-word-editor .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          background: #fdfdfd;
          padding: 1rem !important;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .quill-word-editor .ql-container {
          border: none !important;
          font-size: 1.1rem;
          font-family: var(--font-primary), sans-serif;
          height: calc(100vh - 150px) !important;
          overflow-y: auto;
          background: #f3f4f6;
          padding: 2rem;
        }
        @media (max-width: 900px) {
          .quill-word-editor .ql-container {
            height: auto !important;
            min-height: calc(100vh - 180px) !important;
            padding: 0.75rem !important;
          }
          .quill-word-editor .ql-editor {
            min-height: 450px !important;
            padding: 1.25rem 1rem !important;
          }
        }
        .quill-word-editor .ql-editor {
          background: #fff;
          max-width: 900px;
          margin: 0 auto;
          min-height: 800px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          padding: 3rem 4rem;
          border-radius: 8px;
        }
        /* Toolbar styling for premium feel */
        .ql-toolbar.ql-snow .ql-picker-label { font-weight: bold; }
        .ql-toolbar.ql-snow button:hover, .ql-toolbar.ql-snow button.ql-active, .ql-toolbar.ql-snow .ql-picker-label:hover {
          color: #ef4444 !important;
        }
        .ql-snow.ql-toolbar button:hover .ql-stroke, .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: #ef4444 !important;
        }
        .ql-snow.ql-toolbar button:hover .ql-fill, .ql-snow.ql-toolbar button.ql-active .ql-fill {
          fill: #ef4444 !important;
        }
        .ql-snow .ql-picker.ql-font .ql-picker-options,
        .ql-snow .ql-picker.ql-size .ql-picker-options,
        .ql-snow .ql-picker-options {
          max-height: 260px !important;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
          overscroll-behavior: contain !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2) !important;
          border-radius: 6px !important;
          z-index: 99999 !important;
          scrollbar-width: thin !important;
        }
      `}</style>

      <div className="page-builder-wrapper">
        {/* Giant MS Word-like Canvas */}
        <div className={`page-builder-main ${mobileTab !== 'content' ? 'hide-on-mobile' : ''}`}>
          <ReactQuill 
            theme="snow"
            className="quill-word-editor"
            value={project.contentHtml || ''}
            onChange={(content) => updateField('contentHtml', content)}
            modules={quillModules}
            placeholder="Start typing your beautiful page content here... Use the toolbar above to add colors, fonts, images, and alignments!"
          />
        </div>

        {/* Sidebar for Page & Card Settings */}
        <div className={`page-builder-sidebar ${mobileTab !== 'settings' ? 'hide-on-mobile' : ''}`}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111827', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Page & Card Settings
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Configure the main title, type tag, and top banner image for this project.
          </p>

          <StyledFieldEditor 
            label="Project Title"
            value={project.title}
            onChange={(val) => updateField('title', val)}
            placeholder="e.g. Mastermind Sri Lanka"
            helperText="Custom font, color & bold will render across cards & page"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <StyledFieldEditor 
              label="Type"
              value={project.type}
              onChange={(val) => updateField('type', val)}
              placeholder="e.g. Annual"
            />
            <StyledFieldEditor 
              label="Frequency"
              value={project.frequency}
              onChange={(val) => updateField('frequency', val)}
              placeholder="e.g. Island-wide"
            />
          </div>

          <StyledFieldEditor 
            label="Short Description (For Card)"
            value={project.shortDesc}
            onChange={(val) => updateField('shortDesc', val)}
            isTextarea
            rows={4}
            placeholder="Enter short summary for project cards..."
            helperText="This description appears on project cards across the site"
          />

          <hr style={{ borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', margin: 0, textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>
              Main Poster / Image
            </label>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '0.75rem', textAlign: 'center', background: '#fff' }}>
              {project.image && (
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <img src={project.image} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'contain', borderRadius: '4px', background: '#f8fafc' }} />
                </div>
              )}
              
              <input 
                value={project.image}
                onChange={(e) => updateField('image', e.target.value)}
                placeholder="Or paste image URL here"
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '0.75rem' }}
              />

              <label style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9', color: '#475569', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #cbd5e1', transition: 'background 0.2s' }}>
                {isUploading ? 'Uploading...' : '📁 Upload New Image'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadImage} disabled={isUploading} />
              </label>
            </div>
          </div>

          <hr style={{ borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Danger Zone</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ef4444', display: 'block', marginBottom: '0.5rem' }}>URL Slug</label>
              <input 
                value={project.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2' }}
              />
              <p style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '0.3rem' }}>Warning: Changing this breaks existing links!</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
