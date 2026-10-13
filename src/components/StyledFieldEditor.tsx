'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  parseStyledText,
  formatStyledText,
  GOOGLE_FONTS_50,
  PRESET_COLORS,
  TextStyle
} from '@/utils/styledText';

interface StyledFieldEditorProps {
  label: string;
  value: string | undefined | null;
  onChange: (newValue: string) => void;
  isTextarea?: boolean;
  rows?: number;
  placeholder?: string;
  helperText?: string;
}

export default function StyledFieldEditor({
  label,
  value,
  onChange,
  isTextarea = false,
  rows = 3,
  placeholder = '',
  helperText
}: StyledFieldEditorProps) {
  // Parse incoming value
  const parsed = parseStyledText(value);
  const [text, setText] = useState(parsed.text);
  const [font, setFont] = useState(parsed.font || '');
  const [color, setColor] = useState(parsed.color || '');
  const [bold, setBold] = useState(!!parsed.bold);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    const p = parseStyledText(value);
    setText(p.text);
    setFont(p.font || '');
    setColor(p.color || '');
    setBold(!!p.bold);
  }, [value]);

  // Close color picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    }
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  const updateAndEmit = (newText: string, newFont: string, newColor: string, newBold: boolean) => {
    setText(newText);
    setFont(newFont);
    setColor(newColor);
    setBold(newBold);
    const formatted = formatStyledText(newText, {
      font: newFont,
      color: newColor,
      bold: newBold
    });
    onChange(formatted);
  };

  const handleTextChange = (val: string) => {
    updateAndEmit(val, font, color, bold);
  };

  const toggleBold = () => {
    updateAndEmit(text, font, color, !bold);
  };

  const handleFontChange = (newFont: string) => {
    updateAndEmit(text, newFont, color, bold);
  };

  const handleColorChange = (newColor: string) => {
    updateAndEmit(text, font, newColor, bold);
  };

  const resetFormatting = () => {
    updateAndEmit(text, '', '', false);
  };

  const hasFormatting = !!(font || color || bold);

  return (
    <div style={{ marginBottom: '1.4rem' }}>
      {/* Top Label & Actions Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', margin: 0, textTransform: 'capitalize' }}>
          {label}
        </label>
        {hasFormatting && (
          <button
            type="button"
            onClick={resetFormatting}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0 0.2rem'
            }}
            title="Clear font, color & bold formatting"
          >
            ↺ Reset Style
          </button>
        )}
      </div>

      {/* Modern Toolbar Bar (Above Input Box) */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderBottom: 'none',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          padding: '0.35rem 0.55rem',
          fontSize: '0.78rem',
          flexWrap: 'wrap'
        }}
      >
        {/* 1. Bold Button */}
        <button
          type="button"
          onClick={toggleBold}
          style={{
            background: bold ? '#0f172a' : '#ffffff',
            color: bold ? '#ffffff' : '#334155',
            border: bold ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
            borderRadius: '5px',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title={bold ? 'Bold (Active)' : 'Make Bold'}
        >
          B
        </button>

        {/* 2. Color Picker Trigger */}
        <div style={{ position: 'relative' }} ref={pickerRef}>
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            style={{
              background: '#ffffff',
              border: color ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
              borderRadius: '5px',
              height: '26px',
              padding: '0 0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#334155'
            }}
            title="Change Text Color"
          >
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: color || '#0f172a',
                border: '1px solid rgba(0,0,0,0.15)',
                display: 'inline-block'
              }}
            />
            <span>{color ? 'Color' : 'Color'}</span>
            <span style={{ fontSize: '0.55rem', color: '#64748b' }}>▼</span>
          </button>

          {/* Color Picker Popover */}
          {showColorPicker && (
            <div
              style={{
                position: 'absolute',
                top: '32px',
                left: '0',
                zIndex: 9999,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                width: '190px'
              }}
            >
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Preset Colors
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem', marginBottom: '0.75rem' }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      handleColorChange(c.value);
                      setShowColorPicker(false);
                    }}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: c.value,
                      border: color === c.value ? '2px solid #0f172a' : '1px solid #cbd5e1',
                      cursor: 'pointer',
                      transform: color === c.value ? 'scale(1.15)' : 'none',
                      transition: 'all 0.15s'
                    }}
                    title={c.name}
                  />
                ))}
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.6rem' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>
                  Custom Hex Color:
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={color || '#0f172a'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    style={{
                      width: '32px',
                      height: '28px',
                      padding: 0,
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#b91c1c"
                    style={{
                      flex: 1,
                      padding: '0.3rem 0.4rem',
                      fontSize: '0.72rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. 50+ Google Fonts Dropdown */}
        <div style={{ flex: 1, minWidth: '120px' }}>
          <select
            value={font}
            onChange={(e) => handleFontChange(e.target.value)}
            style={{
              width: '100%',
              height: '26px',
              padding: '0 0.4rem',
              fontSize: '0.74rem',
              fontWeight: font ? 700 : 500,
              border: font ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
              borderRadius: '5px',
              background: '#ffffff',
              color: font ? '#0f172a' : '#64748b',
              cursor: 'pointer'
            }}
          >
            <option value="">Default Font (Theme)</option>

            <optgroup label="Modern Sans-Serif">
              {GOOGLE_FONTS_50.filter(f => f.category === 'Sans-Serif').map(f => (
                <option key={f.name} value={f.name} style={{ fontFamily: `'${f.name}', sans-serif` }}>
                  {f.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="Impact & Display">
              {GOOGLE_FONTS_50.filter(f => f.category === 'Display').map(f => (
                <option key={f.name} value={f.name} style={{ fontFamily: `'${f.name}', sans-serif` }}>
                  {f.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="Serif & Elegant">
              {GOOGLE_FONTS_50.filter(f => f.category === 'Serif').map(f => (
                <option key={f.name} value={f.name} style={{ fontFamily: `'${f.name}', serif` }}>
                  {f.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="Script & Handwriting">
              {GOOGLE_FONTS_50.filter(f => f.category === 'Script').map(f => (
                <option key={f.name} value={f.name} style={{ fontFamily: `'${f.name}', cursive` }}>
                  {f.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Styled Input or Textarea Box (Direct live preview while typing) */}
      {isTextarea ? (
        <textarea
          rows={rows}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.65rem 0.75rem',
            border: '1px solid #cbd5e1',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            fontSize: '0.88rem',
            lineHeight: 1.5,
            resize: 'vertical',
            fontFamily: font ? `'${font}', sans-serif` : 'inherit',
            color: color || '#0f172a',
            fontWeight: bold ? 'bold' : 'normal',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            outline: 'none',
            background: '#ffffff'
          }}
        />
      ) : (
        <input
          type="text"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            border: '1px solid #cbd5e1',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            fontSize: '0.9rem',
            fontFamily: font ? `'${font}', sans-serif` : 'inherit',
            color: color || '#0f172a',
            fontWeight: bold ? 'bold' : 'normal',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            outline: 'none',
            background: '#ffffff'
          }}
        />
      )}

      {helperText && (
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.68rem', color: '#64748b' }}>
          {helperText}
        </p>
      )}
    </div>
  );
}
