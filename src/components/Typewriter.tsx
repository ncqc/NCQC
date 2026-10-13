'use client';
import { useState, useEffect } from 'react';

export default function Typewriter({ 
  text, 
  speed = 70, 
  className = "" 
}: { 
  text: string; 
  speed?: number; 
  className?: string;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      const doneTimeout = setTimeout(() => {
        setIsDone(true);
      }, 1800);
      return () => clearTimeout(doneTimeout);
    }
  }, [index, text, speed, mounted]);

  if (!mounted) return <span className={className} style={{ display: 'inline' }} />;

  return (
    <span className={className} style={{ display: 'inline' }}>
      {displayedText}
      <span 
        style={{ 
          opacity: isDone ? 0 : 1, 
          transition: 'opacity 0.6s ease',
          animation: isDone ? 'none' : 'blinkCursor 0.8s step-end infinite', 
          marginLeft: '4px', 
          color: 'inherit',
          fontWeight: 400,
          userSelect: 'none'
        }}
      >
        |
      </span>
      <style>{`
        @keyframes blinkCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}
