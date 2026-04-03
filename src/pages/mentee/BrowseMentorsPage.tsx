import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorsApi } from '../../api/services';
import type { TeacherResponseDto } from '../../types';
import { Search, GraduationCap, Star, ArrowRight, Loader2 } from 'lucide-react';

const browseMentorsWorkspaceCss = `
.browse-mentors-workspace {
  --bmw-bg: #f5f6fb;
  --bmw-surface: #ffffff;
  --bmw-surface-soft: #f8f8fc;
  --bmw-border: #ececf3;
  --bmw-text: #17181c;
  --bmw-muted: #7b7f8f;
  --bmw-purple: #7b61ff;
  --bmw-purple-strong: #6a4df6;
  --bmw-purple-soft: rgba(123, 97, 255, 0.12);
  --bmw-green-soft: rgba(35, 178, 109, 0.12);
  --bmw-yellow-soft: rgba(255, 208, 102, 0.18);
  --bmw-shadow: 0 18px 45px rgba(28, 32, 48, 0.06);
  color: var(--bmw-text);
}

.browse-mentors-workspace .bmw-shell {
  background: var(--bmw-bg);
  border: 1px solid var(--bmw-border);
  border-radius: 28px;
  padding: 1.25rem;
  box-shadow: var(--bmw-shadow);
}

.browse-mentors-workspace .bmw-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0.25rem 1rem;
  border-bottom: 1px solid var(--bmw-border);
  margin-bottom: 1rem;
}

.browse-mentors-workspace .bmw-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.browse-mentors-workspace .bmw-brand-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--bmw-purple) 0%, var(--bmw-purple-strong) 100%);
  box-shadow: 0 8px 22px rgba(123, 97, 255, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 1rem;
}

.browse-mentors-workspace .bmw-brand-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
  color: #111111;
}

.browse-mentors-workspace .bmw-brand-sub {
  margin: 0.16rem 0 0;
  color: var(--bmw-muted);
  font-size: 0.88rem;
}

.browse-mentors-workspace .bmw-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  border-radius: 16px;
  background: var(--bmw-surface);
  border: 1px solid var(--bmw-border);
  color: var(--bmw-muted);
  font-size: 0.88rem;
  font-weight: 600;
}

.browse-mentors-workspace .bmw-hero {
  background: var(--bmw-surface);
  border: 1px solid var(--bmw-border);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(21, 26, 38, 0.04);
  padding: 1.4rem;
  margin-bottom: 1rem;
}

.browse-mentors-workspace .bmw-hero-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.browse-mentors-workspace .bmw-hero-title {
  margin: 0 0 0.55rem;
  font-size: 2rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #111111;
}

.browse-mentors-workspace .bmw-hero-desc {
  margin: 0;
  color: var(--bmw-muted);
  font-size: 0.98rem;
  max-width: 48rem;
}

.browse-mentors-workspace .bmw-hero-tag {
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: var(--bmw-purple-soft);
  color: var(--bmw-purple-strong);
  border: 1px solid rgba(123, 97, 255, 0.18);
  font-weight: 700;
  font-size: 0.84rem;
  white-space: nowrap;
}

.browse-mentors-workspace .bmw-search-card {
  background: var(--bmw-surface);
  border: 1px solid var(--bmw-border);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(21, 26, 38, 0.04);
  padding: 1.2rem;
  margin-bottom: 1.2rem;
}

.browse-mentors-workspace .bmw-search-wrap {
  position: relative;
}

.browse-mentors-workspace .bmw-search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--bmw-muted);
  pointer-events: none;
}

.browse-mentors-workspace .bmw-search-input {
  width: 100%;
  min-height: 56px;
  border-radius: 18px;
  border: 1px solid var(--bmw-border);
  background: var(--bmw-surface-soft);
  color: var(--bmw-text);
  font-size: 1.02rem;
  padding: 0.95rem 1rem 0.95rem 3rem;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.browse-mentors-workspace .bmw-search-input:focus {
  outline: none;
  background: #ffffff;
  border-color: rgba(123, 97, 255, 0.35);
  box-shadow: 0 0 0 4px rgba(123, 97, 255, 0.12);
}

.browse-mentors-workspace .bmw-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.browse-mentors-workspace .bmw-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  background: var(--bmw-surface);
  border: 1px solid var(--bmw-border);
  border-radius: 24px;
}

.browse-mentors-workspace .bmw-card {
  background: var(--bmw-surface);
  border: 1px solid var(--bmw-border);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(21, 26, 38, 0.04);
  display: flex;
  flex-direction: column;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.browse-mentors-workspace .bmw-card:hover {
  transform: translateY(-3px);
  border-color: rgba(123, 97, 255, 0.18);
  box-shadow: 0 16px 34px rgba(123, 97, 255, 0.09);
}

.browse-mentors-workspace .bmw-card-banner {
  height: 128px;
  background:
    radial-gradient(circle at top right, rgba(123, 97, 255, 0.24), transparent 34%),
    radial-gradient(circle at bottom left, rgba(123, 97, 255, 0.10), transparent 26%),
    linear-gradient(135deg, #ece8ff 0%, #f6f4ff 45%, #ffffff 100%);
  border-bottom: 1px solid rgba(123, 97, 255, 0.08);
}

.browse-mentors-workspace .bmw-card-body {
  padding: 1.35rem;
  margin-top: -54px;
}

.browse-mentors-workspace .bmw-avatar {
  width: 84px;
  height: 84px;
  border-radius: 24px;
  background: linear-gradient(135deg, #f1e9ff 0%, #ece8ff 100%);
  border: 4px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.5rem;
  overflow: hidden;
  margin-bottom: 1rem;
  color: var(--bmw-purple);
  box-shadow: 0 10px 24px rgba(123, 97, 255, 0.12);
}

.browse-mentors-workspace .bmw-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.browse-mentors-workspace .bmw-name {
  margin: 0 0 0.3rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: #111111;
}

.browse-mentors-workspace .bmw-specialization {
  margin: 0 0 1rem;
  color: var(--bmw-purple-strong);
  font-weight: 700;
  font-size: 0.9rem;
}

.browse-mentors-workspace .bmw-meta {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-bottom: 1.25rem;
}

.browse-mentors-workspace .bmw-meta-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 20px;
  color: var(--bmw-muted);
  font-size: 0.84rem;
}

.browse-mentors-workspace .bmw-meta-badge {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: var(--bmw-purple-soft);
  color: var(--bmw-purple);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.browse-mentors-workspace .bmw-meta-badge--star {
  background: var(--bmw-yellow-soft);
  color: #c98700;
}

.browse-mentors-workspace .bmw-book-btn {
  width: 100%;
  min-height: 48px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #7b61ff 0%, #6a4df6 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
  padding: 0.85rem 1rem;
  box-shadow: 0 12px 26px rgba(123, 97, 255, 0.22);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.browse-mentors-workspace .bmw-book-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(123, 97, 255, 0.28);
}

@media (max-width: 1080px) {
  .browse-mentors-workspace .bmw-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .browse-mentors-workspace .bmw-shell {
    border-radius: 20px;
    padding: 0.9rem;
  }

  .browse-mentors-workspace .bmw-topbar,
  .browse-mentors-workspace .bmw-hero-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .browse-mentors-workspace .bmw-grid {
    grid-template-columns: 1fr;
  }

  .browse-mentors-workspace .bmw-hero-title {
    font-size: 1.65rem;
  }
}
`;

const BrowseMentorsPage: React.FC = () => {
  const [mentors, setMentors] = useState<TeacherResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 9;
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await mentorsApi.list(pageIndex, PAGE_SIZE);
      if (response.isSuccess && response.data?.items) {
        setMentors(response.data.items);
        if (response.data.totalPages) {
            setTotalPages(response.data.totalPages);
        }
      }
    } catch (err) {
      console.error('Failed to fetch mentors:', err);
    } finally {
      setLoading(false);
    }
  }, [pageIndex]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const filteredMentors = mentors.filter((m) => {
    const name = m.fullName?.toLowerCase() || '';
    const spec = m.specialization?.toLowerCase() || '';
    const dept = m.department?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    return name.includes(search) || spec.includes(search) || dept.includes(search);
  });

  return (
    <>
      <style>{browseMentorsWorkspaceCss}</style>

      <div className="animate-fade-in browse-mentors-workspace">
        <div>
          <div className="bmw-topbar">
            <div className="bmw-brand">
              <div className="bmw-brand-badge">M</div>
              <div>
                <p className="bmw-brand-title">Mentor Discovery</p>
                <p className="bmw-brand-sub">Browse and book sessions</p>
              </div>
            </div>

            <div className="bmw-chip">
              <Star size={16} strokeWidth={1.9} />
              {loading ? 'Loading mentors...' : `${filteredMentors.length} mentors`}
            </div>
          </div>

          <div className="bmw-hero">
  <div className="bmw-hero-head">
    <div>
      <h1 className="bmw-hero-title">Find Your Mentor</h1>
      <p className="bmw-hero-desc">
        Browse our experienced faculty members and book a session to accelerate your learning
      </p>
    </div>

    <div className="bmw-hero-tag">Mentor workspace</div>
  </div>

  <div className="bmw-search-wrap bmw-hero-search">
    <Search className="bmw-search-icon" size={20} strokeWidth={1.9} />
    <input
      type="text"
      className="bmw-search-input"
      placeholder="Search by name, specialization, or department..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
</div>

          {loading ? (
            <div className="bmw-loading">
              <Loader2 className="animate-spin" size={48} color="var(--bmw-purple)" />
            </div>
          ) : (
            <div className="bmw-grid">
              {filteredMentors.map((mentor) => (
                <div key={mentor.id} className="bmw-card">
                  <div className="bmw-card-banner" />

                  <div className="bmw-card-body">
                    <div className="bmw-avatar">
                      {mentor.avatarUrl ? (
                        <img src={mentor.avatarUrl} alt="" />
                      ) : (
                        mentor.fullName.charAt(0)
                      )}
                    </div>

                    <h3 className="bmw-name">{mentor.fullName}</h3>
                    <p className="bmw-specialization">{mentor.specialization}</p>

                    <div className="bmw-meta">
                      <div className="bmw-meta-item">
                        <div className="bmw-meta-badge">
                          <GraduationCap size={15} strokeWidth={1.9} />
                        </div>
                        <span>{mentor.department}</span>
                      </div>

                      <div className="bmw-meta-item">
                        <div className="bmw-meta-badge bmw-meta-badge--star">
                          <Star size={15} strokeWidth={1.9} />
                        </div>
                        <span>4.9 (24 Reviews)</span>
                      </div>
                    </div>

                    <button
                      className="bmw-book-btn"
                      onClick={() => navigate(`/mentee/book/${mentor.id}`)}
                    >
                      View Profile & Book
                      <ArrowRight size={18} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', marginBottom: '2rem', gap: '1.5rem', alignItems: 'center' }}>
               <button
                   onClick={() => {
                       setPageIndex((p) => Math.max(1, p - 1));
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                   }}
                   disabled={pageIndex === 1}
                   className="bmw-book-btn"
                   style={{ padding: '0.6rem 1.2rem', background: pageIndex === 1 ? '#cbd5e1' : undefined, flex: '0 0 auto', width: 'auto', minHeight: 'unset' }}
               >
                   Trang trước
               </button>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.05rem', fontWeight: 600, color: '#475569' }}>
                   Trang
                   <input
                       type="number"
                       min={1}
                       max={totalPages}
                       defaultValue={pageIndex}
                       key={pageIndex}
                       title="Nhập số trang và nhấn Enter"
                       onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                               const val = parseInt(e.currentTarget.value, 10);
                               if (!isNaN(val) && val >= 1 && val <= totalPages && val !== pageIndex) {
                                   setPageIndex(val);
                                   window.scrollTo({ top: 0, behavior: 'smooth' });
                               } else {
                                   e.currentTarget.value = pageIndex.toString();
                               }
                           }
                       }}
                       onBlur={(e) => {
                           const val = parseInt(e.currentTarget.value, 10);
                           if (!isNaN(val) && val >= 1 && val <= totalPages && val !== pageIndex) {
                               setPageIndex(val);
                               window.scrollTo({ top: 0, behavior: 'smooth' });
                           } else {
                               e.currentTarget.value = pageIndex.toString();
                           }
                       }}
                       style={{ 
                           width: '50px', 
                           padding: '0.2rem 0', 
                           textAlign: 'center', 
                           borderRadius: '6px', 
                           border: '1px solid #cbd5e1',
                           fontSize: '1rem',
                           fontWeight: 600,
                           color: '#1e293b',
                           outline: 'none',
                           background: '#fff'
                       }}
                   />
                   / {totalPages}
               </div>
               <button
                   onClick={() => {
                       setPageIndex((p) => Math.min(totalPages, p + 1));
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                   }}
                   disabled={pageIndex === totalPages}
                   className="bmw-book-btn"
                   style={{ padding: '0.6rem 1.2rem', background: pageIndex === totalPages ? '#cbd5e1' : undefined, flex: '0 0 auto', width: 'auto', minHeight: 'unset' }}
               >
                   Trang sau
               </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BrowseMentorsPage;