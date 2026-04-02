import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { reviewApi } from '../../api/reviews';
import { useAuth } from '../../contexts/AuthContext';
import type { ReviewResponseDto, ReviewUserDto } from '../../types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Loader2, Star, Quote, MessageSquare } from 'lucide-react';

function personLabel(u?: ReviewUserDto): string {
  if (!u) return '—';
  return (u.fullName ?? u.fullname ?? '').trim() || u.email?.trim() || '—';
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, color: 'var(--warning)', alignItems: 'center' }} aria-label={`${rating} trên 5 sao`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={18} fill={i < rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

const MentorReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    const res = await reviewApi.getList({
      mentorId: user.id,
      pageNumber: 1,
      pageSize: 100,
      sortBy: 'createdat',
      sorting: true,
    });
    if (res.isSuccess && res.data?.items) {
      setReviews(res.data.items as ReviewResponseDto[]);
    } else {
      setReviews([]);
      if (!res.isSuccess) setError(res.message || 'Không tải được đánh giá');
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [user, load]);

  const stats = useMemo(() => {
    if (!reviews.length) return { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] as number[] };
    const dist = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of reviews) {
      const n = Math.min(5, Math.max(1, r.rating));
      dist[n - 1]++;
      sum += r.rating;
    }
    return { avg: sum / reviews.length, count: reviews.length, dist };
  }, [reviews]);

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Mentor"
        title="Đánh giá từ sinh viên"
        description="Xem nhận xét và số sao sau các buổi mentoring. Đây là phản hồi chỉ đọc — sinh viên tự thêm/sửa/xóa trên tài khoản của họ."
        actions={
          !loading && stats.count > 0 ? (
            <span className="admin-chip">
              TB {stats.avg.toFixed(1)}★ · {stats.count} đánh giá
            </span>
          ) : null
        }
      />

      {error && (
        <div className="admin-panel" style={{ marginBottom: '1rem', borderColor: 'rgba(248,81,73,0.5)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={40} color="var(--brand-primary)" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="admin-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Star size={44} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.7 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Chưa có đánh giá</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto', lineHeight: 1.55 }}>
            Khi sinh viên hoàn tất buổi và gửi đánh giá, nội dung sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <>
          <div className="admin-panel" style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', padding: '1.5rem 1.75rem' }}>
            <div style={{ textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg, #f5c518 0%, #e6a817 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {stats.avg.toFixed(1)}
              </div>
              <div style={{ marginTop: '0.4rem' }}>
                <StarDisplay rating={Math.round(stats.avg)} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.4rem 0 0' }}>{stats.count} lượt đánh giá</p>
            </div>
            <div style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const c = stats.dist[star - 1];
                const pct = stats.count ? (c / stats.count) * 100 : 0;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem', fontSize: '0.8125rem' }}>
                    <span style={{ width: '2.5ch', color: 'var(--text-secondary)', textAlign: 'right', fontWeight: 600 }}>{star}</span>
                    <Star size={13} fill="var(--warning)" color="var(--warning)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: star >= 4 ? 'var(--warning)' : star === 3 ? '#e09020' : 'rgba(248,81,73,0.7)', borderRadius: 99, transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ color: 'var(--text-muted)', width: '2.5ch', fontSize: '0.75rem' }}>{c}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {reviews.map((r) => {
              const borderColor = r.rating >= 4
                ? 'rgba(63,185,80,0.5)'
                : r.rating === 3
                  ? 'rgba(219,171,9,0.5)'
                  : 'rgba(248,81,73,0.45)';
              return (
                <div
                  key={r.id}
                  className="admin-panel"
                  style={{
                    padding: '1.25rem 1.4rem',
                    borderLeft: `3px solid ${borderColor}`,
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        flexShrink: 0,
                        overflow: 'hidden',
                        border: '2px solid var(--glass-border)',
                      }}
                    >
                      {r.mentee?.avatarUrl ? (
                        <img src={r.mentee.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        personLabel(r.mentee).charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700 }}>{personLabel(r.mentee)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MessageSquare size={13} />
                          Booking {r.bookingId.substring(0, 8)}…
                        </span>
                      </div>
                      <StarDisplay rating={r.rating} />
                      {r.comment ? (
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <Quote size={15} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '0.15rem', opacity: 0.6 }} />
                          <p style={{ margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                            {r.comment}
                          </p>
                        </div>
                      ) : (
                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          (Không có nhận xét)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MentorReviewsPage;
