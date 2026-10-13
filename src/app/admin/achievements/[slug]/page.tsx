'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Achievement } from '@/data/achievements';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import StyledFieldEditor from '@/components/StyledFieldEditor';

// Dynamically import react-quill-new to avoid SSR and React 19 findDOMNode issues
const ReactQuill = dynamic(async () => {
  const mod = await import('react-quill-new');
  const Quill = mod.Quill;
  if (Quill) {
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

    const BlockEmbed = Quill.import('blots/block/embed') as any;
    class CustomButtonBlot extends BlockEmbed {
      static create(value: any) {
        const node = super.create();
        node.setAttribute('href', value.link);
        node.setAttribute('target', '_blank');
        node.setAttribute('style', `display: inline-block; padding: 12px 28px; background-color: ${value.color || '#d90429'}; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 15px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.15); border: none; cursor: pointer; text-align: center; font-family: inherit;`);
        node.innerText = value.text;
        return node;
      }
      static value(node: any) {
        return {
          link: node.getAttribute('href'),
          color: node.style.backgroundColor,
          text: node.innerText
        };
      }
    }
    CustomButtonBlot.blotName = 'customBtn';
    CustomButtonBlot.tagName = 'a';
    CustomButtonBlot.className = 'custom-canvas-btn';
    Quill.register(CustomButtonBlot, true);
  }
  return mod.default;
}, { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function AchievementVisualEditor({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [mobileTab, setMobileTab] = useState<'content' | 'settings'>('content');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        updateField('image', data.url);
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Network error during upload');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    params.then(async (resolvedParams) => {
      const res = await fetch(`/api/achievements?slug=${encodeURIComponent(resolvedParams.slug)}`);
      const json = await res.json();
        
      if (json.success && json.data) {
        const data = json.data;
        // Initialize sidebarWidget if it doesn't exist
        const initData = { ...data };
        if (!initData.sidebarWidget) {
          initData.sidebarWidget = {
            enabled: true,
            title: 'Year of Glory',
            value: initData.year,
            buttonText: 'View Gallery',
            buttonLink: '/gallery'
          };
        }
        if (!initData.contentHtml && initData.fullDesc) {
          // Convert array to paragraphs for Quill
          initData.contentHtml = initData.fullDesc.map((p: string) => `<p>${p}</p>`).join('');
        }
        setAchievement(initData);
      } else {
        setError('Achievement not found');
      }
    }).catch(err => {
      console.error(err);
      setError('Failed to load achievement');
    });
  }, [params]);

  // Extended Quill modules for FULL MS Word-like formatting
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
        ['link', 'image', 'video', 'customBtn'],
        ['clean']
      ],
      handlers: {
        'customBtn': function() {
          const text = prompt('Enter Button Text (e.g., View Results):');
          if (!text) return;
          const link = prompt('Enter Button Link URL (e.g., https://...):');
          if (!link) return;
          const color = prompt('Enter Button Color (e.g., #d90429 or red):', '#d90429');
          
          const quill = (this as any).quill;
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'customBtn', { text, link, color }, 'user');
          quill.setSelection(range.index + 1);
        }
      }
    }
  }), []);

  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;
  if (!achievement) return <div className="p-10 text-center text-gray-500">Loading editor...</div>;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { id, sidebarWidget, ...dataToSave } = achievement as any;
      const res = await fetch('/api/achievements', {
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

  const updateField = (field: keyof Achievement, value: any) => {
    setAchievement({ ...achievement, [field]: value });
  };

  const handleToggleFeatured = async (checked: boolean) => {
    if (checked) {
      // Check how many are currently featured
      try {
        const res = await fetch('/api/achievements');
        const json = await res.json();
        const list: Achievement[] = json.success && json.data ? json.data : [];
        const count = list.filter(a => a.isFeatured && a.slug !== achievement.slug).length;
          
        // If there are already 3 or more (and this one isn't one of them yet), block it.
        if (count >= 3 && !achievement.isFeatured) {
          alert('You can only feature a maximum of 3 achievements on the Home Page! Please un-feature another one first.');
          return; // Do not update
        }
      } catch (err) {
        console.error('Error checking featured count:', err);
        alert('Could not verify featured status. Please try again.');
        return;
      }
    }
    updateField('isFeatured', checked);
  };

  const addCustomButton = () => {
    const currentBtns = achievement.customButtons || [];
    updateField('customButtons', [...currentBtns, { text: 'New Button', link: 'https://', color: '#111827' }]);
  };

  const updateCustomButton = (index: number, key: string, value: string) => {
    const currentBtns = [...(achievement.customButtons || [])];
    currentBtns[index] = { ...currentBtns[index], [key]: value };
    updateField('customButtons', currentBtns);
  };

  const removeCustomButton = (index: number) => {
    const currentBtns = [...(achievement.customButtons || [])];
    currentBtns.splice(index, 1);
    updateField('customButtons', currentBtns);
  };

  const updateWidget = (field: string, value: any) => {
    setAchievement({
      ...achievement,
      sidebarWidget: {
        ...achievement.sidebarWidget!,
        [field]: value
      }
    });
  };



  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.5)',
    border: '1px dashed #ef4444',
    outline: 'none',
    width: '100%',
    padding: '0.2rem',
    borderRadius: '4px',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    textAlign: 'inherit' as any,
    lineHeight: 'inherit',
    textTransform: 'inherit' as any,
    letterSpacing: 'inherit',
    transition: 'background 0.2s, border 0.2s',
  };

  const inputFocusStyle = { background: '#fff', border: '1px solid #ef4444' };

  return (
    <div className="achievement-builder-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f3f4f6' }}>
      
      {/* MS Word-like Sticky Top Bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0.6rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => router.push('/admin/achievements')}
            style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: '#111827' }}>Page Builder</h1>
            <p className="desktop-only-sub" style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Design the entire page content here.</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold', color: '#374151', background: '#fef2f2', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #fee2e2' }}>
            <input 
              type="checkbox" 
              checked={achievement.isFeatured || false} 
              onChange={e => handleToggleFeatured(e.target.checked)} 
              style={{ width: '1.1rem', height: '1.1rem', accentColor: '#ef4444' }} 
            />
            ⭐ <span className="featured-label-text">Show on Home</span>
          </label>
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
          .achievement-builder-root {
            height: auto !important;
            min-height: 100vh !important;
            overflow: visible !important;
          }
          .desktop-only-sub {
            display: none !important;
          }
          .featured-label-text {
            display: none;
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
      `}</style>

      <div className="page-builder-wrapper">
        {/* Giant MS Word-like Canvas */}
        <div className={`page-builder-main ${mobileTab !== 'content' ? 'hide-on-mobile' : ''}`}>
          <ReactQuill 
            theme="snow"
            className="quill-word-editor"
            value={achievement.contentHtml}
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
            Configure the main title, category tag, and top banner image for this achievement.
          </p>

          <StyledFieldEditor 
            label="Achievement Title"
            value={achievement.title}
            onChange={(val) => updateField('title', val)}
            placeholder="e.g. PIXELEON '26"
            helperText="Custom font, color & bold will render across cards & page"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <StyledFieldEditor 
              label="Type / Category"
              value={achievement.type}
              onChange={(val) => updateField('type', val)}
              placeholder="e.g. Award"
            />
            <StyledFieldEditor 
              label="Year"
              value={achievement.year}
              onChange={(val) => updateField('year', val)}
              placeholder="e.g. 2026"
            />
          </div>

          <hr style={{ borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />

          {/* Custom Buttons Config */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', margin: 0, textTransform: 'uppercase' }}>
                Content Buttons
              </label>
              <button 
                onClick={addCustomButton}
                style={{ background: '#111827', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                + Add Button
              </button>
            </div>
            
            <p style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '1rem' }}>
              These buttons will appear beautifully styled at the bottom of the content. Perfect for "View Gallery", "Download Results", etc.
            </p>

            {(achievement.customButtons || []).map((btn, idx) => (
              <div key={idx} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', position: 'relative' }}>
                <button 
                  onClick={() => removeCustomButton(idx)}
                  style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#fff', border: 'none', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}
                  title="Remove button"
                >
                  ✕
                </button>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '0.2rem' }}>Button Text</label>
                  <input 
                    value={btn.text}
                    onChange={(e) => updateCustomButton(idx, 'text', e.target.value)}
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '0.2rem' }}>URL / Link</label>
                  <input 
                    value={btn.link}
                    onChange={(e) => updateCustomButton(idx, 'link', e.target.value)}
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '0.2rem' }}>Button Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="color"
                      value={btn.color || '#111827'}
                      onChange={(e) => updateCustomButton(idx, 'color', e.target.value)}
                      style={{ width: '30px', height: '30px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input 
                      value={btn.color || '#111827'}
                      onChange={(e) => updateCustomButton(idx, 'color', e.target.value)}
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {(!achievement.customButtons || achievement.customButtons.length === 0) && (
              <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed #d1d5db', borderRadius: '8px', color: '#9ca3af', fontSize: '0.8rem' }}>
                No custom buttons added yet.
              </div>
            )}
          </div>

          <hr style={{ borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
              Cover Image / Poster
            </label>

            {/* Supabase Drag & Drop Upload Zone */}
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '10px',
              padding: '1.25rem 1rem',
              textAlign: 'center',
              background: isUploading ? '#fef2f2' : '#f9fafb',
              cursor: isUploading ? 'wait' : 'pointer',
              position: 'relative',
              transition: 'all 0.2s',
            }}>
              <input 
                type="file" 
                accept="image/*"
                disabled={isUploading}
                onChange={handleFileUpload}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: isUploading ? 'wait' : 'pointer'
                }}
              />
              {isUploading ? (
                <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  ⏳ Uploading directly to Supabase...
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '1.6rem', marginBottom: '0.2rem' }}>☁️</div>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#1f2937' }}>
                    Click or Drag Image to Upload
                  </p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: '#6b7280' }}>
                    Uploads directly to Supabase Storage
                  </p>
                </div>
              )}
            </div>

            {uploadError && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 600 }}>
                ⚠️ {uploadError}
              </p>
            )}

            {/* Image URL (Auto-filled on upload) */}
            <div style={{ marginTop: '0.75rem' }}>
              <label style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                Image Link (Auto-filled on upload):
              </label>
              <input 
                value={achievement.image}
                onChange={(e) => updateField('image', e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff' }}
              />
            </div>

            {achievement.image && (
              <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f8fafc', padding: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <img 
                  src={achievement.image} 
                  alt="preview" 
                  style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', display: 'block', borderRadius: '4px' }} 
                  onError={(e) => e.currentTarget.style.display = 'none'} 
                />
              </div>
            )}
          </div>

          <StyledFieldEditor 
            label="Short Description"
            value={achievement.shortDesc}
            onChange={(val) => updateField('shortDesc', val)}
            isTextarea
            rows={4}
            placeholder="Enter short summary for achievement cards..."
            helperText="This description appears on achievement cards across the site"
          />

        </div>
      </div>
    </div>
  );
}
