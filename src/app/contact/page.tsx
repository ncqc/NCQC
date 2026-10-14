export const revalidate = 60;

export default function ContactPage() {
  return (
    <section className="about-hero" style={{ paddingTop: '15rem' }}>
        <div className="container relative-container">
            <div className="contact-bg-logo"></div>

            <div className="reveal-text">
                <h1 className="page-title" style={{ textAlign: 'center', color: '#111', WebkitTextStroke: '0', fontFamily: 'var(--font-super-mellow), "SuperMellow", sans-serif' }}>Contact Details</h1>
            </div>
            
            <div className="about-content reveal-fade delay-1 is-visible" style={{ position: 'relative', zIndex: 2 }}>
                <div className="lead-pill-wrap">
                  <div className="lead-pill-badge">
                    <span className="lead-pill-dot"></span>
                    <span className="lead-pill-text" style={{ color: '#64748b' }}>Get in touch with the executive committee for inquiries and collaborations.</span>
                  </div>
                </div>
                
                <div className="contact-grid">
                    <div className="contact-card reveal-fade up is-visible">
                        <div className="contact-role">President</div>
                        <h3 className="contact-name">Kemitha Randinu</h3>
                        <div className="contact-details">
                            <a href="tel:+94723648022" className="contact-link">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                                +94 72 3648 022
                            </a>
                            <a href="mailto:Kemitharandinu@gmail.com" className="contact-link">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                                Kemitharandinu@gmail.com
                            </a>
                        </div>
                    </div>
                    
                    <div className="contact-card reveal-fade up delay-1 is-visible">
                        <div className="contact-role">Secretary</div>
                        <h3 className="contact-name">Sadeesh Mamuhewa</h3>
                        <div className="contact-details">
                            <a href="tel:+94761805071" className="contact-link">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                                +94 76 180 5071
                            </a>
                            <a href="mailto:Sadeeshmm@gmail.com" className="contact-link">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                                Sadeeshmm@gmail.com
                            </a>
                        </div>
                    </div>

                    <div className="contact-card reveal-fade up delay-2 is-visible">
                        <div className="contact-role">Teacher-In-Charge</div>
                        <h3 className="contact-name">Mrs. Lakmali Kahingala</h3>
                        <div className="contact-details">
                            <a href="tel:+94770251699" className="contact-link">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                                +94 77 025 1699
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}
