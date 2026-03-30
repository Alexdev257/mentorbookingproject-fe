import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorsApi } from '../../api/services';
import type { TeacherResponseDto } from '../../types';
import { Search, GraduationCap, Star, ArrowRight, Loader2 } from 'lucide-react';

const BrowseMentorsPage: React.FC = () => {
  const [mentors, setMentors] = useState<TeacherResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await mentorsApi.list(1, 100);
        if (response.isSuccess && response.data?.items) {
          setMentors(response.data.items);
        }
      } catch (err) {
        console.error('Failed to fetch mentors:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, []);

  const filteredMentors = mentors.filter(m => {
    const name = m.fullName?.toLowerCase() || '';
    const spec = m.specialization?.toLowerCase() || '';
    const dept = m.department?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return name.includes(search) || spec.includes(search) || dept.includes(search);
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1>Find Your Mentor</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Browse our experienced faculty members and book a session to accelerate your learning</p>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="text" 
            className="input-field" 
            style={{ paddingLeft: '3rem', fontSize: '1.125rem' }} 
            placeholder="Search by name, specialization, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}><Loader2 className="animate-spin" size={48} color="var(--brand-primary)" /></div>
      ) : (
        <div className="dashboard-grid">
          {filteredMentors.map((mentor) => (
            <div key={mentor.id} className="glass-card mentor-card no-hover" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '120px', background: 'var(--brand-gradient)', opacity: 0.1 }}></div>
              <div style={{ padding: '1.5rem', marginTop: '-60px' }}>
                <div style={{ 
                  width: 80, height: 80, borderRadius: '50%', 
                  background: 'var(--bg-tertiary)', border: '4px solid var(--bg-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.5rem', overflow: 'hidden', marginBottom: '1rem'
                }}>
                  {mentor.avatarUrl ? <img src={mentor.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : mentor.fullName.charAt(0)}
                </div>
                
                <h3 style={{ marginBottom: '0.25rem' }}>{mentor.fullName}</h3>
                <p style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem' }}>{mentor.specialization}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <GraduationCap size={14} /> {mentor.department}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <Star size={14} color="var(--warning)" fill="var(--warning)" /> 4.9 (24 Reviews)
                  </div>
                </div>

                <button 
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate(`/mentee/book/${mentor.id}`)}
                >
                  View Profile & Book <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseMentorsPage;
