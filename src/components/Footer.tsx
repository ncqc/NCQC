'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer-clean">
        <div className="container footer-flex">
            <div className="footer-left">
                <img src="/logo.png" alt="Quiz Club Logo" className="brand-logo" />
            </div>
            <div className="footer-right">
                <div className="footer-links-row">
                    <Link href="/">Home</Link>
                    <Link href="/about">About</Link>
                    <Link href="/team">Our Team</Link>
                    <Link href="/achievements">Achievements</Link>
                    <Link href="/projects">Projects</Link>
                    <Link href="/competitions">Competitions</Link>
                    <Link href="/gallery">Gallery</Link>
                    <Link href="/contact">Contact</Link>
                </div>
                <div className="footer-social-row">
                    <a href="https://facebook.com/ncquizclub" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>
                    </a>
                    <a href="https://instagram.com/_.ncqc._" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92 1.27-.06 1.65-.07 4.85-.07m0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.27 2.7.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.63 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.63-6.78-6.98-6.98-1.28-.06-1.69-.07-4.95-.07z"/><path d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4z"/><circle cx="18.41" cy="5.59" r="1.44"/></svg>
                    </a>
                    <a href="https://twitter.com/ncquizclub" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href="mailto:nalandaquizclub@gmail.com" aria-label="Email">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    </a>
                </div>
            </div>
        </div>
        <div className="footer-bottom">
            <div className="container footer-bottom-flex">
                <div className="footer-bottom-left">
                    &copy; 2026 <strong>Nalanda College Quiz Club.</strong> All rights reserved.
                </div>
                <div className="footer-bottom-middle">
                    <Link href="/privacy">Privacy Policy</Link>
                    <Link href="/terms">Terms of Service</Link>
                    <Link href="/cookies">Cookies</Link>
                    <Link href="/imprint">Imprint</Link>
                </div>
                <div className="footer-bottom-right">
                    Developed by <a href="https://yoshithanikila.vercel.app" target="_blank" rel="noopener noreferrer">Yoshitech Solutions</a>
                </div>
            </div>
        </div>
    </footer>
  );
}
