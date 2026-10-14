'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path ? 'active' : '';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link href="/" className="brand">
          <img src="/logo.png" alt="Quiz Society Logo" className="brand-logo" />
        </Link>
        <div 
          className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
        <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <li><Link href="/" prefetch={true} className={isActive('/')}>Home</Link></li>
          <li><Link href="/about" prefetch={true} className={isActive('/about')}>About</Link></li>
          <li><Link href="/team" prefetch={true} className={isActive('/team')}>Our Team</Link></li>
          <li><Link href="/achievements" prefetch={true} className={isActive('/achievements')}>Achievements</Link></li>
          <li><Link href="/projects" prefetch={true} className={isActive('/projects') || pathname.startsWith('/projects') ? 'active' : ''}>Projects</Link></li>
          <li><Link href="/competitions" prefetch={true} className={isActive('/competitions')}>Competitions</Link></li>
          <li><Link href="/gallery" prefetch={true} className={isActive('/gallery') || pathname.startsWith('/gallery') ? 'active' : ''}>Gallery</Link></li>
          <li><Link href="/contact" prefetch={true} className={isActive('/contact')}>Contact</Link></li>
        </ul>
      </div>
    </nav>
  );
}
