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
      <div className="nav-container split-nav-container">
        {/* Mobile-only brand logo (left-aligned) */}
        <Link href="/" className="brand mobile-brand" aria-label="NCQC Home">
          <img src="/logo.png" alt="Quiz Society Logo" className="brand-logo" />
        </Link>

        {/* Mobile Hamburger button */}
        <div 
          className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Desktop Left Nav Links */}
        <ul className="nav-links nav-links-left desktop-only-links">
          <li><Link href="/" prefetch={true} className={isActive('/')}>Home</Link></li>
          <li><Link href="/about" prefetch={true} className={isActive('/about')}>About</Link></li>
          <li><Link href="/team" prefetch={true} className={isActive('/team')}>Our Team</Link></li>
          <li><Link href="/achievements" prefetch={true} className={isActive('/achievements')}>Achievements</Link></li>
        </ul>

        {/* Desktop Center Brand Logo */}
        <Link href="/" className="brand desktop-center-brand" aria-label="NCQC Home">
          <img src="/logo.png" alt="Quiz Society Logo" className="brand-logo" />
        </Link>

        {/* Desktop Right Nav Links */}
        <ul className="nav-links nav-links-right desktop-only-links">
          <li><Link href="/projects" prefetch={true} className={isActive('/projects') || pathname.startsWith('/projects') ? 'active' : ''}>Projects</Link></li>
          <li><Link href="/competitions" prefetch={true} className={isActive('/competitions')}>Competitions</Link></li>
          <li><Link href="/gallery" prefetch={true} className={isActive('/gallery') || pathname.startsWith('/gallery') ? 'active' : ''}>Gallery</Link></li>
          <li><Link href="/contact" prefetch={true} className={isActive('/contact')}>Contact</Link></li>
        </ul>

        {/* Mobile Drawer Menu */}
        <ul className={`nav-links mobile-drawer ${mobileMenuOpen ? 'active' : ''}`}>
          <li><Link href="/" onClick={() => setMobileMenuOpen(false)} className={isActive('/')}>Home</Link></li>
          <li><Link href="/about" onClick={() => setMobileMenuOpen(false)} className={isActive('/about')}>About</Link></li>
          <li><Link href="/team" onClick={() => setMobileMenuOpen(false)} className={isActive('/team')}>Our Team</Link></li>
          <li><Link href="/achievements" onClick={() => setMobileMenuOpen(false)} className={isActive('/achievements')}>Achievements</Link></li>
          <li><Link href="/projects" onClick={() => setMobileMenuOpen(false)} className={isActive('/projects') || pathname.startsWith('/projects') ? 'active' : ''}>Projects</Link></li>
          <li><Link href="/competitions" onClick={() => setMobileMenuOpen(false)} className={isActive('/competitions')}>Competitions</Link></li>
          <li><Link href="/gallery" onClick={() => setMobileMenuOpen(false)} className={isActive('/gallery') || pathname.startsWith('/gallery') ? 'active' : ''}>Gallery</Link></li>
          <li><Link href="/contact" onClick={() => setMobileMenuOpen(false)} className={isActive('/contact')}>Contact</Link></li>
        </ul>
      </div>
    </nav>
  );
}
