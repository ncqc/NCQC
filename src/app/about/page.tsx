export default function AboutPage() {
  return (
    <section className="about-hero" style={{ paddingTop: '15rem' }}>
        <div className="container">
            <div className="reveal-text">
                <h1 className="page-title" style={{ textAlign: 'center', color: '#111', WebkitTextStroke: '0', fontFamily: 'var(--font-brutalist)' }}>Our Story</h1>
            </div>
            <div className="about-content reveal-fade delay-1 is-visible">
                <p className="lead-text" style={{ color: '#475569', fontSize: '1.25rem', lineHeight: '1.6', textAlign: 'center', margin: '0 auto 4rem auto', maxWidth: '800px' }}>Pioneers of knowledge since 1982, cultivating brilliance at Nalanda College.</p>
                
                <div className="about-grid">
                    <div className="about-text">
                        <div className="about-box">
                            <h2 className="about-box-title" style={{ marginBottom: '1.5rem' }}>About Us</h2>
                            <p className="about-box-text" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>
                                Firstly formed in 1982, Nalanda College Quiz Club proudly celebrates its 43rd anniversary in this year. Since then it has contributed to carve good personalities to the society by giving them knowledge and other different skills too. It has also rendered a lot of services to our Alma Mater by spreading the school&apos;s legacy throughout the community.
                            </p>
                            <p className="about-box-text" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>
                                In recent years, the Quiz club has been able to influence a lot of young minds of Nalanda College and to introduce them to quiz scenarios. We are conducting weekly lectures as well as online weekly quizzes on different topics to give them knowledge and other skills like communication and teamwork.
                            </p>
                            <p className="about-box-text" style={{ fontSize: '1rem', marginBottom: '0' }}>
                                Nalanda College Quiz Club is a pioneer in the co-curricular and extra-curricular activities of the college. This makes a significant contribution to the development of the universal knowledge of the entire student community of the college.
                            </p>
                        </div>
                    </div>
                    
                    <div className="about-stats">
                        <div className="stat-item">
                            <span className="stat-num">1982</span>
                            <span className="stat-label">Established</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-num">43</span>
                            <span className="stat-label">Years of Excellence</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-num">90+</span>
                            <span className="stat-label">Active Members</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}
