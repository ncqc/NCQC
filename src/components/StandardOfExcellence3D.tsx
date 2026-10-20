'use client';

import React, { useState, useRef } from 'react';

interface ExcellenceCard {
  number: string;
  icon: string;
  title: string;
  desc: string;
  tag: string;
  gradientText: string;
  badgeGradient: string;
  glowColor: string;
  borderColor: string;
  accentBg: string;
  accentColor: string;
}

const CARDS: ExcellenceCard[] = [
  {
    number: '01',
    icon: '🧠',
    title: 'Intellectual Mastery',
    desc: 'Going beyond textbooks. We train the sharpest minds to conquer challenges, provoke deep thought, and continuously expand their intellectual horizons.',
    tag: 'Deep Knowledge & Tactics',
    gradientText: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 50%, #06b6d4 100%)',
    badgeGradient: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
    glowColor: 'rgba(79, 70, 229, 0.28)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
    accentBg: 'rgba(79, 70, 229, 0.08)',
    accentColor: '#4f46e5'
  },
  {
    number: '02',
    icon: '⚔️',
    title: 'Championship Legacy',
    desc: 'From fierce inter-school battles to national championships, we proudly represent our college, dominating the island\'s most prestigious quiz arenas.',
    tag: 'All-Island Dominance',
    gradientText: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%)',
    badgeGradient: 'linear-gradient(135deg, #ef4444, #f97316)',
    glowColor: 'rgba(239, 68, 68, 0.28)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    accentBg: 'rgba(239, 68, 68, 0.08)',
    accentColor: '#dc2626'
  },
  {
    number: '03',
    icon: '🌐',
    title: 'Elite Community',
    desc: 'More than just a club. We foster a collaborative, distraction-free environment where passionate learners share knowledge and grow into future leaders.',
    tag: 'Fellowship of Scholars',
    gradientText: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #14b8a6 100%)',
    badgeGradient: 'linear-gradient(135deg, #059669, #14b8a6)',
    glowColor: 'rgba(16, 185, 129, 0.28)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    accentBg: 'rgba(16, 185, 129, 0.08)',
    accentColor: '#059669'
  }
];

function Single3DExcellenceCard({ card }: { card: ExcellenceCard }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, isHovered: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = (x - centerX) / centerX;
    const tiltY = (y - centerY) / centerY;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({
      x: tiltX,
      y: tiltY,
      glareX,
      glareY,
      isHovered: true
    });
  };

  const handleMouseLeave = () => {
    setTilt({
      x: 0,
      y: 0,
      glareX: 50,
      glareY: 50,
      isHovered: false
    });
  };

  const transformStyle = tilt.isHovered
    ? `perspective(1000px) rotateX(${tilt.y * -14}deg) rotateY(${tilt.x * 14}deg) translateZ(20px) scale3d(1.03, 1.03, 1.03)`
    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        flex: 1,
        minWidth: '290px',
        maxWidth: '380px',
        transform: transformStyle,
        transition: tilt.isHovered
          ? 'transform 0.1s ease-out, box-shadow 0.3s ease'
          : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s ease',
        transformStyle: 'preserve-3d',
        position: 'relative',
        borderRadius: '32px',
        padding: '4.5rem 2.2rem 2.5rem',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1.5px solid ${tilt.isHovered ? card.borderColor : 'rgba(226, 232, 240, 0.85)'}`,
        boxShadow: tilt.isHovered
          ? `0 32px 60px -15px ${card.glowColor}, 0 10px 25px -5px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.95)`
          : '0 15px 35px -10px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.85)',
        cursor: 'pointer',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        userSelect: 'none'
      }}
    >
      {/* 3D Dynamic Glare Sheen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: tilt.isHovered
            ? `radial-gradient(circle 240px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.7), transparent 70%)`
            : 'none',
          pointerEvents: 'none',
          borderRadius: '32px',
          opacity: tilt.isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
          zIndex: 5
        }}
      />

      {/* 3D Protruding Number Orb */}
      <div
        style={{
          position: 'absolute',
          top: '-42px',
          left: '50%',
          transform: 'translateX(-50%) translateZ(45px)',
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          background: card.badgeGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-super-mellow), "SuperMellow", sans-serif',
          fontSize: '1.9rem',
          fontWeight: 900,
          color: '#ffffff',
          boxShadow: `0 14px 28px -6px ${card.glowColor}, inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -3px 6px rgba(0, 0, 0, 0.2)`,
          border: '3px solid #ffffff',
          zIndex: 15,
          transition: 'transform 0.3s ease'
        }}
      >
        {card.number}
      </div>

      {/* Subtle Color Accent Glow Orb */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '100px',
          height: '100px',
          background: card.glowColor,
          filter: 'blur(40px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          transform: 'translateZ(-10px)'
        }}
      />

      {/* Floating 3D Icon Badge */}
      <div
        style={{
          transform: 'translateZ(30px)',
          width: '54px',
          height: '54px',
          borderRadius: '16px',
          background: card.accentBg,
          border: `1px solid ${card.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          marginBottom: '1.25rem',
          boxShadow: `0 8px 18px -4px ${card.glowColor}`,
          transition: 'transform 0.3s ease'
        }}
      >
        {card.icon}
      </div>

      {/* Card Title using SuperMellowRegular */}
      <h3
        style={{
          fontFamily: 'var(--font-super-mellow), "SuperMellow", sans-serif',
          fontSize: '1.65rem',
          fontWeight: 900,
          color: '#0f172a',
          margin: '0 0 1rem 0',
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
          transform: 'translateZ(35px)'
        }}
      >
        {card.title}
      </h3>

      {/* Card Description */}
      <p
        style={{
          fontSize: '0.94rem',
          color: '#475569',
          lineHeight: 1.65,
          margin: '0 0 1.75rem 0',
          transform: 'translateZ(20px)',
          fontWeight: 500
        }}
      >
        {card.desc}
      </p>

      {/* Bottom Tag Pill */}
      <div
        style={{
          marginTop: 'auto',
          transform: 'translateZ(25px)',
          width: '100%'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontFamily: 'var(--font-super-mellow), "SuperMellow", sans-serif',
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: card.accentColor,
            background: card.accentBg,
            border: `1px solid ${card.borderColor}`,
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            width: '100%',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}
        >
          <span>●</span>
          <span>{card.tag}</span>
        </div>
      </div>
    </div>
  );
}

export default function StandardOfExcellence3D() {
  return (
    <section
      id="excellence"
      style={{
        position: 'relative',
        padding: '5rem 1.5rem 7rem',
        overflow: 'hidden',
        background: 'transparent'
      }}
    >
      {/* Ambient Depth Orbs in Background */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '10%',
          width: '320px',
          height: '320px',
          background: 'rgba(79, 70, 229, 0.1)',
          filter: 'blur(100px)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '350px',
          height: '350px',
          background: 'rgba(16, 185, 129, 0.1)',
          filter: 'blur(110px)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-the-globe), "TheGlobe", sans-serif',
              fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
              color: 'var(--red)',
              margin: '0 0 0.5rem 0',
              letterSpacing: '0.02em',
              lineHeight: 1.15
            }}
          >
            The Standard of Excellence
          </h2>
          <div
            style={{
              width: '60px',
              height: '4px',
              background: 'linear-gradient(90deg, #ef4444, #f97316)',
              borderRadius: '9999px',
              margin: '0.75rem auto 0'
            }}
          />
        </div>

        {/* 3D Cards Grid */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: '2.5rem',
            paddingTop: '2rem'
          }}
        >
          {CARDS.map((card) => (
            <Single3DExcellenceCard key={card.number} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
