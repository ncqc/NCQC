export const revalidate = 60;

export default function TeamPage() {
  return (
    <section className="about-hero" style={{ paddingTop: '15rem' }}>
        <div className="container" style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 1.5rem' }}>
            <div className="reveal-text">
                <h1 className="page-title" style={{ textAlign: 'center', color: '#111', WebkitTextStroke: '0', fontFamily: 'var(--font-super-mellow), "SuperMellow", sans-serif' }}>Our Team</h1>
            </div>
            <div className="about-content reveal-fade delay-1 is-visible">
                <div className="lead-pill-wrap">
                  <div className="lead-pill-badge">
                    <span className="lead-pill-dot"></span>
                    <span className="lead-pill-text" style={{ color: '#64748b' }}>The brilliant minds driving the Nalanda College Quiz Club.</span>
                  </div>
                </div>
                
                <h2 className="section-subtitle">Teachers-In-Charge</h2>
                <div className="team-grid team-grid-3">
                    <div className="team-member reveal-fade up is-visible">
                        <div className="member-img-placeholder"></div>
                        <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>Mrs. Lakmali Kahingala</h4>
                        <p className="member-post">Teacher-In-Charge</p>
                    </div>
                    <div className="team-member reveal-fade up delay-1 is-visible">
                        <div className="member-img-placeholder"></div>
                        <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>Mrs. Madhuwanthi Nirudhika</h4>
                        <p className="member-post">Teacher-In-Charge</p>
                    </div>
                    <div className="team-member reveal-fade up delay-2 is-visible">
                        <div className="member-img-placeholder"></div>
                        <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>Mrs. Dilshika Priyankara</h4>
                        <p className="member-post">Teacher-In-Charge</p>
                    </div>
                </div>

                <h2 className="section-subtitle" style={{ marginTop: '5rem' }}>Executive Committee</h2>
                {/* Upper Line: 4 Boxes */}
                <div className="team-grid team-grid-4">
                    <div className="team-member reveal-fade up is-visible">
                        <div className="member-img-placeholder"></div>
                        <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>Kemitha Randinu</h4>
                        <p className="member-post">President</p>
                    </div>
                    <div className="team-member reveal-fade up delay-1 is-visible">
                        <div className="member-img-placeholder"></div>
                        <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>Sadeesh Mamuhewa</h4>
                        <p className="member-post">Secretary</p>
                    </div>
                    <div className="team-member reveal-fade up delay-2 is-visible">
                        <div className="member-img-placeholder"></div>
                        <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>Vidusha Perera</h4>
                        <p className="member-post">Treasurer</p>
                    </div>
                    <div className="team-member reveal-fade up delay-3 is-visible">
                        <div className="member-img-placeholder"></div>
                        <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>Ahas Ranasinghe</h4>
                        <p className="member-post">Vice President</p>
                    </div>
                </div>

                {/* Bottom Line: 3 Boxes */}
                <div className="team-grid team-grid-3">
                    <div className="team-member reveal-fade up is-visible">
                        <div className="member-img-placeholder"></div>
                        <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>Deenal Wathsilu</h4>
                        <p className="member-post">Chief Organizer</p>
                    </div>
                    <div className="team-member reveal-fade up delay-1 is-visible">
                        <div className="member-img" style={{ backgroundImage: 'url("/senuda.png")' }}></div>
                        <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>Senuda Hansira</h4>
                        <p className="member-post">Assistant Secretary</p>
                    </div>
                    <div className="team-member reveal-fade up delay-2 is-visible">
                        <div className="member-img-placeholder"></div>
                        <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>Bisandu Dulmira</h4>
                        <p className="member-post">Media Coordinator</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}
