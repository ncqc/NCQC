'use client';

import React, { useState, useEffect } from 'react';

interface DateTimePickerModalProps {
  isOpen: boolean;
  initialValue?: string;
  title?: string;
  onClose: () => void;
  onSelect: (formattedDate: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function DateTimePickerModal({
  isOpen,
  initialValue,
  title = 'SELECT DATE & TIME',
  onClose,
  onSelect
}: DateTimePickerModalProps) {
  // Parse date into clean components
  const parseComponents = (val?: string) => {
    let d = new Date();
    if (val) {
      try {
        const cleaned = val.replace(/\bat\b/gi, ' ').replace(/\s+/g, ' ').trim();
        const parsed = new Date(cleaned);
        if (!isNaN(parsed.getTime())) {
          d = parsed;
        }
      } catch {}
    }
    const rawHours = d.getHours();
    let h12 = rawHours % 12;
    if (h12 === 0) h12 = 12;
    const p: 'AM' | 'PM' = rawHours >= 12 ? 'PM' : 'AM';

    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      dayOfWeek: d.getDay(),
      hours: h12,
      minutes: d.getMinutes(),
      period: p
    };
  };

  const initialParsed = parseComponents(initialValue);

  const [selectedYear, setSelectedYear] = useState<number>(initialParsed.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialParsed.month);
  const [selectedDay, setSelectedDay] = useState<number>(initialParsed.day);

  const [viewYear, setViewYear] = useState<number>(initialParsed.year);
  const [viewMonth, setViewMonth] = useState<number>(initialParsed.month);

  const [hours, setHours] = useState<number>(initialParsed.hours);
  const [minutes, setMinutes] = useState<number>(initialParsed.minutes);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialParsed.period);

  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');

  useEffect(() => {
    if (isOpen) {
      const p = parseComponents(initialValue);
      setSelectedYear(p.year);
      setSelectedMonth(p.month);
      setSelectedDay(p.day);
      setViewYear(p.year);
      setViewMonth(p.month);
      setHours(p.hours);
      setMinutes(p.minutes);
      setPeriod(p.period);
      setActiveTab('date');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedYear(viewYear);
    setSelectedMonth(viewMonth);
    setSelectedDay(day);
  };

  const handleConfirm = () => {
    const monthName = MONTH_NAMES[selectedMonth];
    const displayHour = hours < 10 ? `0${hours}` : `${hours}`;
    const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const displayDay = selectedDay < 10 ? `0${selectedDay}` : `${selectedDay}`;

    const formattedStr = `${monthName} ${displayDay}, ${selectedYear} at ${displayHour}:${displayMinutes} ${period}`;
    onSelect(formattedStr);
    onClose();
  };

  // Header display calculations
  const tempDate = new Date(selectedYear, selectedMonth, selectedDay);
  const dayOfWeekStr = DAY_NAMES_SHORT[tempDate.getDay()];
  const shortMonthStr = MONTH_NAMES[selectedMonth].slice(0, 3);
  const timeDisplayStr = `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes} ${period}`;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '360px',
          background: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInScale 0.2s ease-out'
        }}
      >
        {/* Header (Matching Image 2 - Android Material Style) */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
            padding: '1.25rem 1.5rem',
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.85 }}>
            {title}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.35rem' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {dayOfWeekStr}, {shortMonthStr} {selectedDay}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, opacity: 0.95, background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
              {timeDisplayStr}
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: '0.2rem' }}>
            {selectedYear}
          </div>

          {/* Mode switch pills: Date vs Time */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('date')}
              style={{
                flex: 1,
                padding: '0.4rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'date' ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s'
              }}
            >
              📅 Date
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('time')}
              style={{
                flex: 1,
                padding: '0.4rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'time' ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s'
              }}
            >
              ⏰ Time
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === 'date' ? (
          /* Calendar View (Image 2) */
          <div style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
            {/* Month & Year Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#f1f5f9',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    color: '#475569',
                    fontWeight: 'bold'
                  }}
                  title="Previous month"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#f1f5f9',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    color: '#475569',
                    fontWeight: 'bold'
                  }}
                  title="Next month"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Days of week letters (S M T W T F S) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '0.5rem' }}>
              {DAY_LETTERS.map((letter, idx) => (
                <div key={idx} style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>
                  {letter}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
              {/* Blank cells for offset */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`blank-${i}`} style={{ height: '36px' }} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected =
                  selectedDay === day &&
                  selectedMonth === viewMonth &&
                  selectedYear === viewYear;

                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === viewMonth &&
                  new Date().getFullYear() === viewYear;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    style={{
                      height: '36px',
                      width: '36px',
                      margin: '0 auto',
                      borderRadius: '50%',
                      border: isToday && !isSelected ? '1.5px solid #7c3aed' : 'none',
                      background: isSelected ? '#7c3aed' : 'transparent',
                      color: isSelected ? '#ffffff' : '#1e293b',
                      fontWeight: isSelected ? 800 : (isToday ? 700 : 600),
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                      boxShadow: isSelected ? '0 2px 6px rgba(124, 58, 237, 0.35)' : 'none'
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Time View */
          <div style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.75rem', textAlign: 'center' }}>
              Select Exact Time
            </div>

            {/* Hour & Minute Picker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {/* Hours dropdown */}
              <div style={{ textAlign: 'center' }}>
                <select
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#0f172a',
                    cursor: 'pointer'
                  }}
                >
                  {Array.from({ length: 12 }).map((_, i) => {
                    const h = i + 1;
                    return (
                      <option key={h} value={h}>
                        {h < 10 ? `0${h}` : h}
                      </option>
                    );
                  })}
                </select>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 800 }}>HOUR</div>
              </div>

              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#64748b', marginTop: '-16px' }}>:</span>

              {/* Minutes dropdown */}
              <div style={{ textAlign: 'center' }}>
                <select
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#0f172a',
                    cursor: 'pointer'
                  }}
                >
                  {Array.from({ length: 60 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i < 10 ? `0${i}` : i}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 800 }}>MIN</div>
              </div>

              {/* AM / PM Toggle Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPeriod('AM')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: period === 'AM' ? '#7c3aed' : '#cbd5e1',
                    background: period === 'AM' ? '#7c3aed' : '#f8fafc',
                    color: period === 'AM' ? '#fff' : '#475569',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('PM')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: period === 'PM' ? '#7c3aed' : '#cbd5e1',
                    background: period === 'PM' ? '#7c3aed' : '#f8fafc',
                    color: period === 'PM' ? '#fff' : '#475569',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => { setHours(11); setMinutes(59); setPeriod('PM'); }}
                style={{ padding: '0.3rem 0.7rem', fontSize: '0.74rem', borderRadius: '100px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 700, color: '#475569' }}
              >
                ⚡ 11:59 PM (Midnight)
              </button>
              <button
                type="button"
                onClick={() => { setHours(12); setMinutes(0); setPeriod('PM'); }}
                style={{ padding: '0.3rem 0.7rem', fontSize: '0.74rem', borderRadius: '100px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 700, color: '#475569' }}
              >
                ⚡ 12:00 PM (Noon)
              </button>
              <button
                type="button"
                onClick={() => { setHours(9); setMinutes(0); setPeriod('AM'); }}
                style={{ padding: '0.3rem 0.7rem', fontSize: '0.74rem', borderRadius: '100px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 700, color: '#475569' }}
              >
                ⚡ 09:00 AM
              </button>
            </div>
          </div>
        )}

        {/* Footer (Cancel & OK Buttons - Image 2) */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '1rem',
            padding: '0.85rem 1.25rem 1.25rem',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '0.4rem 0.8rem'
            }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '0.5rem 1.3rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
