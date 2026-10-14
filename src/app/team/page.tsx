export const revalidate = 60;

export default function TeamPage() {
  return (
    <section className="about-hero" style={{ paddingTop: '15rem' }}>
        <div className="container">
            <div className="reveal-text">
                <h1 className="page-title" style={{ textAlign: 'center', color: '#111', WebkitTextStroke: '0', fontFamily: 'var(--font-brutalist)' }}>Our Team</h1>
            </div>
            <div className="about-content reveal-fade delay-1 is-visible">
                <p className="lead-text" style={{ color: '#475569', fontSize: '1.25rem', lineHeight: '1.6', textAlign: 'center', margin: '0 auto 4rem auto', maxWidth: '800px' }}>The brilliant minds driving the Nalanda College Quiz Club.</p>
                
                <h2 className="section-subtitle">Teachers-In-Charge</h2>
                <div className="team-grid">
                    <div className="team-member reveal-fade up is-visible">
                        <div className="member-img-placeholder">Portrait</div>
                        <h4 className="member-name">Mrs. Lakmali Kahingala</h4>
                        <p className="member-post">Teacher-In-Charge</p>
                    </div>
                    <div className="team-member reveal-fade up delay-1 is-visible">
                        <div className="member-img-placeholder">Portrait</div>
                        <h4 className="member-name">Mrs. Madhuwanthi Nirudhika</h4>
                        <p className="member-post">Teacher-In-Charge</p>
                    </div>
                    <div className="team-member reveal-fade up delay-2 is-visible">
                        <div className="member-img-placeholder">Portrait</div>
                        <h4 className="member-name">Mrs. Dilshika Priyankara</h4>
                        <p className="member-post">Teacher-In-Charge</p>
                    </div>
                </div>

                <h2 className="section-subtitle" style={{ marginTop: '5rem' }}>Executive Committee</h2>
                <div className="team-grid">
                    <div className="team-member reveal-fade up is-visible">
                        <div className="member-img-placeholder">Portrait</div>
                        <h4 className="member-name">Kemitha Randinu</h4>
                        <p className="member-post">President</p>
                    </div>
                    <div className="team-member reveal-fade up delay-1 is-visible">
                        <div className="member-img-placeholder">Portrait</div>
                        <h4 className="member-name">Sadeesh Mamuhewa</h4>
                        <p className="member-post">Secretary</p>
                    </div>
                    <div className="team-member reveal-fade up delay-2 is-visible">
                        <div className="member-img-placeholder">Portrait</div>
                        <h4 className="member-name">Vidusha Perera</h4>
                        <p className="member-post">Treasurer</p>
                    </div>
                    <div className="team-member reveal-fade up is-visible">
                        <div className="member-img-placeholder">Portrait</div>
                        <h4 className="member-name">Ahas Ranasinghe</h4>
                        <p className="member-post">Vice President</p>
                    </div>
                    <div className="team-member reveal-fade up delay-1 is-visible">
                        <div className="member-img-placeholder">Portrait</div>
                        <h4 className="member-name">Deenal Wathsilu</h4>
                        <p className="member-post">Chief Organizer</p>
                    </div>
                    <div className="team-member reveal-fade up delay-2 is-visible">
                        <div className="member-img" style={{ backgroundImage: 'url("/senuda.png")' }}></div>
                        <h4 className="member-name">Senuda Hansira</h4>
                        <p className="member-post">Assistant Secretary</p>
                    </div>
                    <div className="team-member reveal-fade up is-visible">
                        <div className="member-img-placeholder">Portrait</div>
                        <h4 className="member-name">Bisandu Dulmira</h4>
                        <p className="member-post">Media Coordinator</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}
