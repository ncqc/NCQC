'use client';

import React, { useState, useRef, useEffect } from 'react';

interface StatItem {
  id: string;
  badge: string;
  icon: string;
  targetNum: number;
  suffix: string;
  label: string;
  desc: string;
  metric: string;
  gradientText: string;
  glowColor: string;
  cardBorder: string;
  badgeBg: string;
  badgeColor: string;
  orbColor: string;
}

const STATS_DATA: StatItem[] = [
  {
    id: 'legacy',
    badge: 'SINCE 1982',
    icon: '🏛️',
    targetNum: 44,
    suffix: '',
    label: 'Years of Legacy',
    desc: 'Four decades of intellectual heritage, shaping champion minds.',
    metric: 'Est. 1982 • Landmark Heritage',
    gradientText: 'linear-gradient(135deg, #ff2a6d 0%, #ff5e3a 50%, #ffa500 100%)',
    glowColor: 'rgba(255, 59, 107, 0.28)',
    cardBorder: 'rgba(255, 94, 58, 0.35)',
    badgeBg: 'rgba(255, 59, 107, 0.12)',
    badgeColor: '#ff3366',
    orbColor: 'rgba(255, 42, 109, 0.15)'
  },
  {
    id: 'members',
    badge: 'ACTIVE GUILD',
    icon: '⚡',
    targetNum: 90,
    suffix: '+',
    label: 'Active Scholars',
    desc: 'Passionate student thinkers and competitive quiz tacticians.',
    metric: 'Junior & Senior Wings',
    gradientText: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #7000ff 100%)',
    glowColor: 'rgba(79, 172, 254, 0.28)',
    cardBorder: 'rgba(79, 172, 254, 0.35)',
    badgeBg: 'rgba(0, 242, 254, 0.12)',
    badgeColor: '#00b4d8',
    orbColor: 'rgba(79, 172, 254, 0.15)'
  },
  {
    id: 'victories',
    badge: 'ALL-ISLAND TITLES',
    icon: '🏆',
    targetNum: 50,
    suffix: '+',
    label: 'Competitions Won',
    desc: 'Dominating prestigious national circuits and invitational shields.',
    metric: 'Champions of Prestigious Arenas',
    gradientText: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #f59e0b 100%)',
    glowColor: 'rgba(16, 185, 129, 0.28)',
    cardBorder: 'rgba(16, 185, 129, 0.35)',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeColor: '#059669',
    orbColor: 'rgba(16, 185, 129, 0.15)'
  }
];

function SingleStat3DCard({ stat, isVisible }: { stat: StatItem; isVisible: boolean }) {
  const [count, setCount] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, isHovered: false });
  const cardRef = useRef<HTMLDivElement>(null);

  // Smooth Count-Up Animation
  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp: number | null = null;
    const duration = 1800; // 1.8s smooth count

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing: easeOutCubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easedProgress * stat.targetNum));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(stat.targetNum);
      }
    };

    requestAnimationFrame(step);
  }, [isVisible, stat.targetNum]);

  // 3D Mouse Parallax & Light Glare
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
    ? `perspective(1000px) rotateX(${tilt.y * -12}deg) rotateY(${tilt.x * 12}deg) translateZ(18px) scale3d(1.025, 1.025, 1.025)`
    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        flex: 1,
        minWidth: '280px',
        maxWidth: '380px',
        transform: transformStyle,
        transition: tilt.isHovered 
          ? 'transform 0.1s ease-out, box-shadow 0.3s ease' 
          : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s ease',
        transformStyle: 'preserve-3d',
        position: 'relative',
        borderRadius: '28px',
        padding: '2.5rem 2rem 2.2rem',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1.5px solid ${tilt.isHovered ? stat.cardBorder : 'rgba(226, 232, 240, 0.8)'}`,
        boxShadow: tilt.isHovered
          ? `0 28px 50px -15px ${stat.glowColor}, 0 10px 25px -5px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9)`
          : '0 12px 30px -10px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        userSelect: 'none'
      }}
    >
      {/* 3D Ambient Light Reflection Sheen (Glare) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: tilt.isHovered
            ? `radial-gradient(circle 220px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.65), transparent 70%)`
            : 'none',
          pointerEvents: 'none',
          borderRadius: '28px',
          transition: 'opacity 0.2s ease',
          opacity: tilt.isHovered ? 1 : 0
        }}
      />

      {/* Subtle Color Accent Ring in Top Right */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          background: stat.glowColor,
          filter: 'blur(35px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          transform: 'translateZ(-10px)'
        }}
      />

      {/* 3D Floating Icon & Badge Tag */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          transform: 'translateZ(30px)',
          marginBottom: '1.25rem'
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: stat.badgeBg,
            border: `1px solid ${stat.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.45rem',
            boxShadow: `0 8px 16px -4px ${stat.glowColor}`,
            transform: tilt.isHovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1) rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        >
          {stat.icon}
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: stat.badgeColor,
            background: stat.badgeBg,
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            border: `1px solid ${stat.cardBorder}`
          }}
        >
          {stat.badge}
        </span>
      </div>

      {/* Multi-layered 3D Number Counter */}
      <div
        style={{
          transform: 'translateZ(45px)',
          marginBottom: '0.4rem',
          position: 'relative'
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(3.4rem, 5.5vw, 4.8rem)',
            fontWeight: 950,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            margin: 0,
            background: stat.gradientText,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 6px 12px ${stat.glowColor})`
          }}
        >
          {count}
          {stat.suffix}
        </h2>
      </div>

      {/* 3D Label */}
      <div style={{ transform: 'translateZ(25px)', marginBottom: '0.65rem' }}>
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 850,
            color: '#0f172a',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            margin: 0
          }}
        >
          {stat.label}
        </h3>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '0.85rem',
          color: '#64748b',
          lineHeight: 1.5,
          margin: '0 0 1.25rem 0',
          transform: 'translateZ(15px)'
        }}
      >
        {stat.desc}
      </p>

      {/* Footer Pill Metric */}
      <div
        style={{
          marginTop: 'auto',
          transform: 'translateZ(20px)',
          width: '100%'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#475569',
            background: 'rgba(241, 245, 249, 0.8)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            padding: '0.4rem 0.9rem',
            borderRadius: '9999px',
            width: '100%',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}
        >
          <span style={{ color: stat.badgeColor, fontSize: '0.8rem' }}>●</span>
          {stat.metric}
        </div>
      </div>
    </div>
  );
}

export default function Stats3DSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="explore"
      style={{
        position: 'relative',
        padding: '2.5rem 1.5rem 4.5rem',
        overflow: 'hidden',
        background: 'transparent'
      }}
    >
      {/* 3D Ambient Aurora Glows in Background */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '12%',
          width: '320px',
          height: '320px',
          background: 'rgba(255, 42, 109, 0.12)',
          filter: 'blur(90px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          animation: 'floatSlow 7s ease-in-out infinite alternate'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '380px',
          height: '380px',
          background: 'rgba(0, 242, 254, 0.12)',
          filter: 'blur(100px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          animation: 'floatSlow 9s ease-in-out infinite alternate-reverse'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '12%',
          width: '340px',
          height: '340px',
          background: 'rgba(16, 185, 129, 0.12)',
          filter: 'blur(95px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          animation: 'floatSlow 8s ease-in-out infinite alternate'
        }}
      />

      {/* Decorative Cybernetic Particle Grid Gridline Accent */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at center, rgba(15, 23, 42, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
          opacity: 0.7
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
        {/* 3D Cards Grid */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: '1.75rem'
          }}
        >
          {STATS_DATA.map((stat) => (
            <SingleStat3DCard
              key={stat.id}
              stat={stat}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes floatSlow {
          0% {
            transform: translateY(0px) scale(1);
          }
          100% {
            transform: translateY(-24px) scale(1.08);
          }
        }
      `}</style>
    </section>
  );
}
