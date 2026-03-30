import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { reviewApi } from '../../api/reviews';
import { useAuth } from '../../contexts/AuthContext';
import type { ReviewResponseDto, ReviewUserDto } from '../../types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Loader2, Star, MessageSquare } from 'lucide-react';

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
          <div className="admin-panel" style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{stats.avg.toFixed(2)}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>Điểm trung bình / 5</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>{stats.count} lượt đánh giá</p>
            </div>
            <div style={{ flex: 1, minWidth: 200, maxWidth: 320 }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const c = stats.dist[star - 1];
                const pct = stats.count ? (c / stats.count) * 100 : 0;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.75rem' }}>
                    <span style={{ width: '3ch', color: 'var(--text-muted)' }}>{star}★</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--warning)', borderRadius: 99 }} />
                    </div>
                    <span style={{ color: 'var(--text-muted)', width: '2ch' }}>{c}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((r) => (
              <div key={r.id} className="admin-panel" style={{ padding: '1.25rem 1.35rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', minWidth: 0 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {r.mentee?.avatarUrl ? (
                        <img src={r.mentee.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        personLabel(r.mentee).charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{personLabel(r.mentee)}</div>
                      <StarDisplay rating={r.rating} />
                      {r.comment ? (
                        <p style={{ margin: '0.75rem 0 0', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                          {r.comment}
                        </p>
                      ) : (
                        <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          (Không có nhận xét)
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MessageSquare size={14} />
                    Booking {r.bookingId.substring(0, 8)}…
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MentorReviewsPage;
