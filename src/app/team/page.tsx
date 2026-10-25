import { getTeamMembers } from '@/data/team';
import { maskImageUrl } from '@/utils/media';

export const revalidate = 60;

export default async function TeamPage() {
  const allMembers = await getTeamMembers();
  const teachers = allMembers.filter(m => m.category === 'teacher');
  const executives = allMembers.filter(m => m.category === 'executive');

  // Split executives into upper line (up to 4) and bottom line (remaining) for visual balance
  const execUpper = executives.slice(0, 4);
  const execLower = executives.slice(4);

  return (
    <section className="about-hero" style={{ paddingTop: '15rem', paddingBottom: '8rem' }}>
      <div className="container" style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="reveal-text">
          <h1 className="page-title" style={{ textAlign: 'center', color: '#111', WebkitTextStroke: '0', fontFamily: 'var(--font-super-mellow), "SuperMellow", sans-serif' }}>
            Our Team
          </h1>
        </div>
        <div className="about-content reveal-fade delay-1 is-visible">
          <div className="lead-pill-wrap">
            <div className="lead-pill-badge">
              <span className="lead-pill-dot"></span>
              <span className="lead-pill-text" style={{ color: '#64748b' }}>The brilliant minds driving the Nalanda College Quiz Club.</span>
            </div>
          </div>
          
          {/* Teachers-In-Charge Section */}
          <h2 className="section-subtitle">Teachers-In-Charge</h2>
          <div className="team-grid team-grid-3">
            {teachers.map((member, idx) => (
              <div key={member.id || idx} className={`team-member reveal-fade up ${idx > 0 ? `delay-${idx}` : ''} is-visible`}>
                {member.image ? (
                  <div 
                    className="member-img" 
                    style={{ 
                      backgroundImage: `url("${maskImageUrl(member.image)}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }} 
                  />
                ) : (
                  <div className="member-img-placeholder" />
                )}
                <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>
                  {member.name}
                </h4>
                <p className="member-post">{member.role}</p>
              </div>
            ))}
          </div>

          {/* Executive Committee Section */}
          <h2 className="section-subtitle" style={{ marginTop: '5rem' }}>Executive Committee</h2>
          
          {/* Upper Line: 4 Boxes */}
          <div className="team-grid team-grid-4">
            {execUpper.map((member, idx) => (
              <div key={member.id || idx} className={`team-member reveal-fade up ${idx > 0 ? `delay-${idx}` : ''} is-visible`}>
                {member.image ? (
                  <div 
                    className="member-img" 
                    style={{ 
                      backgroundImage: `url("${maskImageUrl(member.image)}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }} 
                  />
                ) : (
                  <div className="member-img-placeholder" />
                )}
                <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>
                  {member.name}
                </h4>
                <p className="member-post">{member.role}</p>
              </div>
            ))}
          </div>

          {/* Bottom Line: Remaining Boxes */}
          {execLower.length > 0 && (
            <div className={`team-grid ${execLower.length === 3 ? 'team-grid-3' : 'team-grid-4'}`} style={{ marginTop: '2rem' }}>
              {execLower.map((member, idx) => (
                <div key={member.id || idx} className={`team-member reveal-fade up ${idx > 0 ? `delay-${idx}` : ''} is-visible`}>
                  {member.image ? (
                    <div 
                      className="member-img" 
                      style={{ 
                        backgroundImage: `url("${maskImageUrl(member.image)}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }} 
                    />
                  ) : (
                    <div className="member-img-placeholder" />
                  )}
                  <h4 className="member-name" style={{ fontFamily: 'var(--font-manline), "ManlineSlabs", serif' }}>
                    {member.name}
                  </h4>
                  <p className="member-post">{member.role}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
