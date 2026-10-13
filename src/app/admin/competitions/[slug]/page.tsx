'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Competition, competitionsData } from '@/data/competitions';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import DateTimePickerModal from '@/components/DateTimePickerModal';
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

    const fontList = [
      'sans-serif', 'serif', 'monospace', 'inter', 'roboto', 'open-sans', 'montserrat', 'poppins', 'lato', 
      'oswald', 'raleway', 'playfair-display', 'merriweather', 'nunito', 'ubuntu', 'rubik', 'work-sans', 
      'lora', 'fira-sans', 'quicksand', 'barlow', 'mulish', 'pt-serif', 'mukta', 'nunito-sans', 'bebas-neue', 
      'anton', 'josefin-sans', 'dancing-script'
    ];

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

function parseToDateAndTimeString(str?: string): { datePart: string; timePart: string } {
  if (!str) return { datePart: '', timePart: '00:00' };
  try {
    const cleaned = str.replace(/\bat\b/gi, ' ').replace(/\s+/g, ' ').trim();
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return { datePart: `${y}-${m}-${day}`, timePart: `${h}:${min}` };
    }
  } catch {}
  return { datePart: '', timePart: '00:00' };
}

function formatFromDateAndTime(datePart: string, timePart: string): string {
  if (!datePart) return '';
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours24, minutes] = (timePart || '00:00').split(':').map(Number);
  const d = new Date(year, month - 1, day, hours24 || 0, minutes || 0);
  if (isNaN(d.getTime())) return datePart;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  let h = d.getHours();
  const p = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  const mStr = String(d.getMinutes()).padStart(2, '0');
  const dayNum = d.getDate();
  return `${monthNames[d.getMonth()]} ${dayNum < 10 ? `0${dayNum}` : dayNum}, ${d.getFullYear()} at ${hStr}:${mStr} ${p}`;
}

export default function CompetitionVisualEditor({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');
  const [pickerTarget, setPickerTarget] = useState<'eventDate' | 'deadline' | null>(null);
  const [mobileTab, setMobileTab] = useState<'content' | 'settings'>('content');
  const [otherStarredCount, setOtherStarredCount] = useState<number>(0);

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

  const handleToggleStarred = async (checked: boolean) => {
    if (checked) {
      if (otherStarredCount >= 3) {
        alert('⚠️ You can only feature a maximum of 3 competitions on the Home Page!\n\nThere are already 3 competitions featured. Please remove the star (★) from another competition first before featuring this one.');
        return;
      }
    }
    updateField('isStarred', checked);

    try {
      const setRes = await fetch('/api/settings');
      const setData = await setRes.json();
      const currentList: string[] = setData?.settings?.starredCompetitionSlugs || [];
      const currentSlug = competition?.slug || '';
      const nextList = checked
        ? Array.from(new Set([...currentList, currentSlug]))
        : currentList.filter(s => s !== currentSlug);

      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starredCompetitionSlugs: nextList })
      });
    } catch (e) {
      console.error('Failed to sync star status:', e);
    }
  };

  useEffect(() => {
    params.then(async (resolvedParams) => {
      let loadedData: Competition | null = null;
      let starredList: string[] = [];

      try {
        const setRes = await fetch('/api/settings');
        const setData = await setRes.json();
        if (setData.success && setData.settings) {
          starredList = setData.settings.starredCompetitionSlugs || [];
        }
      } catch (err) {
        console.warn('Failed to load settings:', err);
      }

      // 1. Try fetching from Supabase first
      const decodedParam = decodeURIComponent(resolvedParams.slug || '').trim().toLowerCase();
      try {
        const { data, error } = await supabase
          .from('competition')
          .select('*');

        if (!error && data && data.length > 0) {
          const others = (data as Competition[]).filter(c => {
            const cDec = decodeURIComponent(c.slug || '').trim().toLowerCase();
            return cDec !== decodedParam && starredList.includes(c.slug);
          });
          setOtherStarredCount(others.length);

          const match = (data as Competition[]).find((c) => {
            const cDecoded = decodeURIComponent(c.slug || '').trim().toLowerCase();
            return cDecoded === decodedParam || c.slug === resolvedParams.slug || (c.slug && c.slug.trim() === resolvedParams.slug.trim());
          });
          if (match) loadedData = match;
        }
      } catch (sbErr) {
        console.warn('Supabase fetch failed, trying local fallback:', sbErr);
      }

      // 2. Local fallback if not found in Supabase
      if (!loadedData) {
        const others = competitionsData.filter(c => {
          const cDec = decodeURIComponent(c.slug || '').trim().toLowerCase();
          return cDec !== decodedParam && starredList.includes(c.slug);
        });
        setOtherStarredCount(others.length);

        const local = competitionsData.find((c) => {
          const cDecoded = decodeURIComponent(c.slug || '').trim().toLowerCase();
          return cDecoded === decodedParam || c.slug === resolvedParams.slug || (c.slug && c.slug.trim() === resolvedParams.slug.trim());
        });
        if (local) {
          loadedData = { ...local };
        }
      }

      if (loadedData) {
        const isCurrentStarred = starredList.includes(resolvedParams.slug) || starredList.includes(loadedData.slug);
        const initData: Competition = { ...loadedData, isStarred: isCurrentStarred };
        if (!initData.contentHtml && initData.fullDesc) {
          initData.contentHtml = initData.fullDesc.map(p => `<p>${p}</p>`).join('');
        }
        if (!initData.eventDate) {
          initData.eventDate = initData.date || 'October 25, 2026';
        }
        if (!initData.deadline) {
          initData.deadline = initData.date || 'October 25, 2026 at 12:00 AM';
        }
        if (!initData.rulesButtonText) {
          initData.rulesButtonText = 'Download Rules & Regs';
        }
        if (!initData.rulesButtonLink) {
          initData.rulesButtonLink = '#';
        }
        if (!initData.submissionsButtonText) {
          initData.submissionsButtonText = `${initData.title} | Submissions →`;
        }
        if (!initData.submissionsButtonLink) {
          initData.submissionsButtonLink = '#';
        }
        setCompetition(initData);
      } else {
        setError('Competition not found');
      }
    }).catch(err => {
      console.error(err);
      setError('Failed to load competition');
    });
  }, [params]);

  // Extended Quill modules for FULL MS Word-like formatting (same 26 fonts as achievements)
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'font': [
          'sans-serif', 'serif', 'monospace', 'inter', 'roboto', 'open-sans', 'montserrat', 'poppins', 'lato', 
          'oswald', 'raleway', 'playfair-display', 'merriweather', 'nunito', 'ubuntu', 'rubik', 'work-sans', 
          'lora', 'fira-sans', 'quicksand', 'barlow', 'mulish', 'pt-serif', 'mukta', 'nunito-sans', 'bebas-neue', 
          'anton', 'josefin-sans', 'dancing-script'
        ] }],
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
          const text = prompt('Enter Button Text (e.g., Register Now):');
          if (!text) return;
          const link = prompt('Enter Button Link URL (e.g., https://...):');
          if (!link) return;
          const color = prompt('Enter Button Color (e.g., #b91c1c or crimson):', '#b91c1c');
          
          const quill = (this as any).quill;
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'customBtn', { text, link, color }, 'user');
          quill.setSelection(range.index + 1);
        }
      }
    }
  }), []);

  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;
  if (!competition) return <div className="p-10 text-center text-gray-500">Loading editor...</div>;

  const handleSave = async () => {
    setIsSaving(true);
    const cleanComp = { ...competition, slug: (competition.slug || '').trim() };
    try {
      // 1. Try saving directly to Supabase table
      let directSbError = null;
      try {
        const { isStarred: _unusedStar, ...compForSupabase } = cleanComp;
        const { error: sbError } = await supabase
          .from('competition')
          .upsert(compForSupabase, { onConflict: 'slug' });
        if (sbError) {
          console.warn('Supabase upsert notice:', sbError.message);
          directSbError = sbError.message;
        }
      } catch (sbErr) {
        console.warn('Supabase direct update error:', sbErr);
      }

      // 2. Also save via API route for local persistence / file sync
      const res = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanComp)
      });

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || 'API failed to save');
      }

      setCompetition(cleanComp);
      if (resData.supabaseNotice || directSbError) {
        alert('Competition saved successfully!\n\nNote for Database: If you want changes to reflect in your Supabase Studio table, please click "2 RLS policies" in Supabase and Disable RLS.');
      } else {
        alert('Competition changes saved successfully!');
      }
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert('Failed to save changes: ' + (err.message || 'Unknown error'));
    }
    setIsSaving(false);
  };

  const updateField = (field: keyof Competition, value: any) => {
    setCompetition(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const updateMultipleFields = (fields: Partial<Competition>) => {
    setCompetition(prev => prev ? { ...prev, ...fields } : prev);
  };

  const addCustomButton = () => {
    const currentBtns = competition.customButtons || [];
    updateField('customButtons', [...currentBtns, { text: 'New Button', link: 'https://', color: '#b91c1c' }]);
  };

  const updateCustomButton = (index: number, key: string, value: string) => {
    const currentBtns = [...(competition.customButtons || [])];
    currentBtns[index] = { ...currentBtns[index], [key]: value };
    updateField('customButtons', currentBtns);
  };

  const removeCustomButton = (index: number) => {
    const currentBtns = [...(competition.customButtons || [])];
    currentBtns.splice(index, 1);
    updateField('customButtons', currentBtns);
  };

  return (
    <div className="competition-builder-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f3f4f6' }}>
      
      {/* MS Word-like Sticky Top Bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0.6rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => router.push('/admin/competitions')}
            style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: '#111827' }}>Competition Editor</h1>
            <p className="desktop-only-sub" style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Design guidelines, dates, links, and rules content.</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: competition.isStarred ? '#fef3c7' : '#f1f5f9',
            border: competition.isStarred ? '1.5px solid #f59e0b' : '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '0.45rem 0.8rem',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: competition.isStarred ? '#b45309' : '#475569',
            transition: 'all 0.2s'
          }}>
            <input 
              type="checkbox"
              checked={!!competition.isStarred}
              onChange={(e) => handleToggleStarred(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: '#f59e0b', width: '15px', height: '15px' }}
            />
            <span>{competition.isStarred ? '★ Featured on Home' : '☆ Feature on Home'}</span>
          </label>

          <button 
            onClick={handleSave} disabled={isSaving}
            style={{
              background: '#b91c1c', color: '#fff', border: 'none', padding: '0.55rem 1.4rem',
              borderRadius: '8px', fontWeight: 'bold', cursor: isSaving ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(185, 28, 28, 0.3)', fontSize: '0.85rem'
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
          width: 380px;
          background: #f9fafb;
          border-left: 1px solid #e5e7eb;
          overflow-y: auto;
          padding: 1.5rem;
        }
        .mobile-editor-tabs {
          display: none;
        }
        @media (max-width: 900px) {
          .competition-builder-root {
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
            color: #b91c1c;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          }
          .page-builder-main.hide-on-mobile,
          .page-builder-sidebar.hide-on-mobile {
            display: none !important;
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
          color: #b91c1c !important;
        }
        .ql-snow.ql-toolbar button:hover .ql-stroke, .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: #b91c1c !important;
        }
        .ql-snow.ql-toolbar button:hover .ql-fill, .ql-snow.ql-toolbar button.ql-active .ql-fill {
          fill: #b91c1c !important;
        }
      `}</style>

      <div className="page-builder-wrapper">
        {/* Giant MS Word-like Canvas */}
        <div className={`page-builder-main ${mobileTab !== 'content' ? 'hide-on-mobile' : ''}`}>
          <ReactQuill 
            theme="snow"
            className="quill-word-editor"
            value={competition.contentHtml}
            onChange={(content) => updateField('contentHtml', content)}
            modules={quillModules}
            placeholder="Start typing your competition guidelines and rules here... Use the ribbon above to format fonts, sizes, colors, and insert images or buttons!"
          />
        </div>

        {/* Sidebar for Competition & Card Settings */}
        <div className={`page-builder-sidebar ${mobileTab !== 'settings' ? 'hide-on-mobile' : ''}`}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111827', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Competition Settings
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Configure titles, countdown dates, downloadable rules, and submission buttons.
          </p>

          {/* Home Page Featured Star Toggle Card */}
          <div style={{
            background: competition.isStarred ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : '#fff',
            border: competition.isStarred ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem',
            boxShadow: competition.isStarred ? '0 4px 12px rgba(245, 158, 11, 0.15)' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={!!competition.isStarred}
                  onChange={(e) => handleToggleStarred(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#f59e0b', width: '16px', height: '16px' }}
                />
                <span>⭐ Feature on Home Page</span>
              </label>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: competition.isStarred ? '#b45309' : '#64748b',
                background: competition.isStarred ? '#fde68a' : '#e2e8f0',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px'
              }}>
                {competition.isStarred ? '★ Featured' : 'Off'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
              Displays in &ldquo;Upcoming Battles&rdquo; section on Home Page. Strict system limit: maximum 3 competitions.
            </p>
          </div>

          {/* Title */}
          <StyledFieldEditor 
            label="Competition Title"
            value={competition.title}
            onChange={(val) => updateField('title', val)}
            placeholder="e.g. BATTLE OF BRAINS 2026"
            helperText="Custom font, color & bold will render on competition headers & cards"
          />

          {/* Slug (read only / editable) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
              URL Slug
            </label>
            <input 
              value={competition.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              placeholder="e.g. battle-of-brains"
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: '#f8fafc' }}
            />
          </div>

          <hr style={{ borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

          {/* Section: 3D Details Card Configuration (Image 2) */}
          <div style={{ background: '#fff', border: '1px solid #fecdd3', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 4px 14px rgba(225, 29, 72, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #fee2e2', paddingBottom: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⏱️</span>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991b1b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  3D Details Card & Timer (Image 2)
                </h3>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#64748b' }}>
                  Configure Event Date & Submissions Countdown strictly via Calendar Modal.
                </p>
              </div>
            </div>

            {/* Event Date (Clean Calendar Modal Trigger Card) */}
            <div style={{ marginBottom: '1.25rem', padding: '0.9rem', background: '#f8fafc', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  📅 Event Date & Time
                </label>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#7c3aed', background: '#f3e8ff', padding: '0.15rem 0.5rem', borderRadius: '100px' }}>
                  Calendar Modal
                </span>
              </div>

              {/* Big Clean Calendar Modal Button */}
              <button
                type="button"
                onClick={() => setPickerTarget('eventDate')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 3px 10px rgba(124, 58, 237, 0.25)',
                  marginBottom: '0.65rem'
                }}
              >
                <span style={{ fontSize: '1rem' }}>🗓️</span> Open Calendar & Time Picker
              </button>

              {/* Current Selected Value Card */}
              <div 
                onClick={() => setPickerTarget('eventDate')}
                style={{ 
                  background: '#ffffff', 
                  border: '1.5px solid #cbd5e1', 
                  borderRadius: '8px', 
                  padding: '0.55rem 0.75rem', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.45rem'
                }}
                title="Click to modify via Calendar Modal"
              >
                <div>
                  <span style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                    Current Event Date:
                  </span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', display: 'block', marginTop: '1px' }}>
                    {competition.eventDate || competition.date || 'Not set'}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>Change ↗</span>
              </div>

              <input 
                value={competition.eventDate || competition.date || ''}
                onChange={(e) => updateMultipleFields({ eventDate: e.target.value, date: e.target.value })}
                placeholder="e.g. October 25, 2026 at 12:00 AM"
                style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#f8fafc', color: '#0f172a', fontWeight: 600 }}
              />
              <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                Displayed in the 3D details card at the top.
              </span>
            </div>

            {/* Submissions Deadline (Clean Calendar Modal Trigger Card + Real-time Countdown) */}
            <div style={{ marginBottom: '1.25rem', padding: '0.9rem', background: '#fff1f2', borderRadius: '10px', border: '1.5px solid #fecdd3' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#991b1b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  ⏰ Submissions Deadline (Countdown)
                </label>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '0.15rem 0.5rem', borderRadius: '100px' }}>
                  Live Timer
                </span>
              </div>

              {/* Big Clean Calendar Modal Button */}
              <button
                type="button"
                onClick={() => setPickerTarget('deadline')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 3px 10px rgba(185, 28, 28, 0.25)',
                  marginBottom: '0.65rem'
                }}
              >
                <span style={{ fontSize: '1rem' }}>🗓️</span> Open Calendar & Time Picker
              </button>

              {/* Current Selected Value Card */}
              <div 
                onClick={() => setPickerTarget('deadline')}
                style={{ 
                  background: '#ffffff', 
                  border: '1.5px solid #fca5a5', 
                  borderRadius: '8px', 
                  padding: '0.55rem 0.75rem', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.45rem'
                }}
                title="Click to modify via Calendar Modal"
              >
                <div>
                  <span style={{ fontSize: '0.64rem', color: '#991b1b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                    Current Deadline:
                  </span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#991b1b', display: 'block', marginTop: '1px' }}>
                    {competition.deadline || 'Not set'}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 700 }}>Change ↗</span>
              </div>

              <input 
                value={competition.deadline || ''}
                onChange={(e) => updateField('deadline', e.target.value)}
                placeholder="e.g. October 25, 2026 at 12:00 AM"
                style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '0.8rem', background: '#fff', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}
              />

              {/* Real-time Deadline Preview Badge */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {(() => {
                  try {
                    const cleaned = (competition.deadline || '').replace(/\bat\b/gi, ' ').trim();
                    const target = new Date(cleaned).getTime();
                    if (!isNaN(target)) {
                      const diff = target - Date.now();
                      if (diff <= 0) {
                        return (
                          <span style={{ width: '100%', textAlign: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                            🔴 Expired: Submissions Deadline Passed
                          </span>
                        );
                      } else {
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        return (
                          <span style={{ width: '100%', textAlign: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #86efac' }}>
                            🟢 Active: {days}d {hours}h {mins}m remaining
                          </span>
                        );
                      }
                    }
                  } catch {}
                  return null;
                })()}
              </div>
            </div>

            {/* Rules & Regulations Button */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                📥 Rules & Regulations Button
              </label>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Button Name / Text:</span>
                <input 
                  value={competition.rulesButtonText || ''}
                  onChange={(e) => updateField('rulesButtonText', e.target.value)}
                  placeholder="Download Rules & Regs"
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', marginTop: '0.2rem' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Button Link / PDF URL:</span>
                <input 
                  value={competition.rulesButtonLink || ''}
                  onChange={(e) => updateField('rulesButtonLink', e.target.value)}
                  placeholder="https://... (or Google Drive link)"
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', marginTop: '0.2rem' }}
                />
              </div>
            </div>

            {/* Submissions / Registration Button */}
            <div style={{ padding: '0.75rem', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991b1b', display: 'block', marginBottom: '0.4rem' }}>
                🚀 Submissions / Registration Button
              </label>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Button Name / Text:</span>
                <input 
                  value={competition.submissionsButtonText || ''}
                  onChange={(e) => updateField('submissionsButtonText', e.target.value)}
                  placeholder="Register Now / Submissions →"
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #fca5a5', fontSize: '0.8rem', marginTop: '0.2rem' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Submission Portal / Form Link:</span>
                <input 
                  value={competition.submissionsButtonLink || ''}
                  onChange={(e) => updateField('submissionsButtonLink', e.target.value)}
                  placeholder="https://forms.google.com/..."
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #fca5a5', fontSize: '0.8rem', marginTop: '0.2rem' }}
                />
              </div>
            </div>
          </div>

          <hr style={{ borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

          {/* Cover Image / Poster with Supabase WebP Drag & Drop */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
              Cover Image / Poster (WebP Storage)
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
                <div style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  ⏳ Converting to WebP & Uploading to Supabase...
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '1.6rem', marginBottom: '0.2rem' }}>☁️</div>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#1f2937' }}>
                    Click or Drag Image to Upload
                  </p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: '#6b7280' }}>
                    Converts to high-performance WebP and stores in Supabase
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
                value={competition.image}
                onChange={(e) => updateField('image', e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff' }}
              />
            </div>

            {competition.image && (
              <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f8fafc', padding: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <img 
                  src={competition.image} 
                  alt="preview" 
                  style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', display: 'block', borderRadius: '4px' }} 
                  onError={(e) => e.currentTarget.style.display = 'none'} 
                />
              </div>
            )}
          </div>

          <StyledFieldEditor 
            label="Short Summary Description"
            value={competition.shortDesc}
            onChange={(val) => updateField('shortDesc', val)}
            isTextarea
            rows={4}
            placeholder="Brief overview shown on the main competition listing cards..."
            helperText="This description appears on competition cards across the site"
          />

          <hr style={{ borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

          {/* Custom Buttons Config at Bottom of Content */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', margin: 0, textTransform: 'uppercase' }}>
                Additional Content Buttons
              </label>
              <button 
                onClick={addCustomButton}
                style={{ background: '#b91c1c', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                + Add Button
              </button>
            </div>
            
            <p style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '1rem' }}>
              Extra buttons shown at the bottom of the guidelines section (e.g. "Leaderboard", "Discussion Group").
            </p>

            {(competition.customButtons || []).map((btn, idx) => (
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
                      value={btn.color || '#b91c1c'}
                      onChange={(e) => updateCustomButton(idx, 'color', e.target.value)}
                      style={{ width: '30px', height: '30px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input 
                      value={btn.color || '#b91c1c'}
                      onChange={(e) => updateCustomButton(idx, 'color', e.target.value)}
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {(!competition.customButtons || competition.customButtons.length === 0) && (
              <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed #d1d5db', borderRadius: '8px', color: '#9ca3af', fontSize: '0.8rem' }}>
                No extra content buttons added yet.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Material Date & Time Picker Modal (Image 2) */}
      {pickerTarget && (
        <DateTimePickerModal
          isOpen={true}
          title={pickerTarget === 'deadline' ? 'SELECT DEADLINE DATE & TIME' : 'SELECT EVENT DATE & TIME'}
          initialValue={pickerTarget === 'deadline' ? (competition.deadline || competition.date) : (competition.eventDate || competition.date)}
          onClose={() => setPickerTarget(null)}
          onSelect={(formatted) => {
            if (pickerTarget === 'eventDate') {
              updateMultipleFields({ eventDate: formatted, date: formatted });
            } else if (pickerTarget === 'deadline') {
              updateField('deadline', formatted);
            }
            setPickerTarget(null);
          }}
        />
      )}
    </div>
  );
}
