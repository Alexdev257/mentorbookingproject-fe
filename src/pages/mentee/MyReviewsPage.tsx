import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { bookingApi } from '../../api/booking';
import { reviewApi } from '../../api/reviews';
import { useAuth } from '../../contexts/AuthContext';
import type { BookingResponseDto, ReviewResponseDto, ReviewUserDto } from '../../types';
import { BookingStatus } from '../../constants/bookingStatus';
import { Loader2, Pencil, Star, Trash2, Plus, Calendar } from 'lucide-react';

function personLabel(u?: ReviewUserDto): string {
  if (!u) return '—';
  return (u.fullName ?? u.fullname ?? '').trim() || '—';
}

/** Đánh giá sau khi buổi đã diễn ra (hết giờ kết thúc) hoặc booking đã hoàn thành. */
function canWriteReviewForBooking(b: BookingResponseDto): boolean {
  if (b.status === BookingStatus.Completed) return true;
  if (b.status !== BookingStatus.Confirmed) return false;
  return new Date(b.scheduleEnd).getTime() <= Date.now();
}

const MyReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formBookingId, setFormBookingId] = useState('');
  const [formMentorId, setFormMentorId] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    const [rRes, bRes] = await Promise.all([
      reviewApi.getList({ menteeId: user.id, pageNumber: 1, pageSize: 50, sortBy: 'createdat', sorting: true }),
      bookingApi.getMenteeBookings(user.id, 1, 50),
    ]);
    if (rRes.isSuccess && rRes.data?.items) {
      setReviews(rRes.data.items as ReviewResponseDto[]);
    } else {
      setReviews([]);
      if (!rRes.isSuccess) setError(rRes.message || 'Không tải được danh sách đánh giá');
    }
    if (bRes.isSuccess && bRes.data?.items) {
      setBookings(bRes.data.items);
    } else {
      setBookings([]);
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

  const reviewedBookingIds = useMemo(
    () => new Set(reviews.map((r) => r.bookingId)),
    [reviews]
  );

  const bookableSessions = useMemo(
    () => bookings.filter((b) => !reviewedBookingIds.has(b.id) && canWriteReviewForBooking(b)),
    [bookings, reviewedBookingIds]
  );

  const bookingById = useMemo(() => {
    const m: Record<string, BookingResponseDto> = {};
    for (const b of bookings) m[b.id] = b;
    return m;
  }, [bookings]);

  const openCreate = () => {
    const first = bookableSessions[0];
    setFormBookingId(first?.id ?? '');
    setFormMentorId(first?.mentorId ?? '');
    setFormRating(5);
    setFormComment('');
    setCreateOpen(true);
  };

  const onBookingPick = (bookingId: string) => {
    setFormBookingId(bookingId);
    const b = bookings.find((x) => x.id === bookingId);
    if (b) setFormMentorId(b.mentorId);
  };

  const submitCreate = async () => {
    if (!formBookingId || !formMentorId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await reviewApi.create({
        bookingId: formBookingId,
        mentorId: formMentorId,
        rating: formRating,
        comment: formComment.trim() || undefined,
      });
      if (!res.isSuccess) {
        setError(res.message || 'Tạo đánh giá thất bại');
        return;
      }
      setCreateOpen(false);
      await load();
    } catch (e) {
      console.error(e);
      setError('Lỗi mạng hoặc máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (r: ReviewResponseDto) => {
    setEditId(r.id);
    setFormRating(r.rating);
    setFormComment(r.comment ?? '');
  };

  const submitEdit = async () => {
    if (!editId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await reviewApi.update(editId, {
        rating: formRating,
        comment: formComment.trim() || undefined,
      });
      if (!res.isSuccess) {
        setError(res.message || 'Cập nhật thất bại');
        return;
      }
      setEditId(null);
      await load();
    } catch (e) {
      console.error(e);
      setError('Lỗi mạng hoặc máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Xóa đánh giá này?')) return;
    setError(null);
    try {
      const res = await reviewApi.delete(id);
      if (!res.isSuccess) {
        setError(res.message || 'Xóa thất bại');
        return;
      }
      await load();
    } catch (e) {
      console.error(e);
      setError('Lỗi mạng hoặc máy chủ.');
    }
  };

  const StarRow: React.FC<{ value: number; onChange: (n: number) => void }> = ({ value, onChange }) => (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: n <= value ? 'var(--warning)' : 'var(--text-muted)',
          }}
          aria-label={`${n} sao`}
        >
          <Star size={28} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1>Đánh giá của tôi</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Đánh giá mentor sau khi buổi đã kết thúc (hoặc trạng thái hoàn thành). Bạn có thể sửa hoặc xóa đánh giá của chính mình.
          </p>
        </div>
        {bookableSessions.length > 0 && (
          <button type="button" className="btn-primary" onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Viết đánh giá
          </button>
        )}
      </div>

      {error && (
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', borderColor: 'var(--error)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={40} color="var(--brand-primary)" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Star size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Chưa có đánh giá</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {bookableSessions.length > 0
              ? 'Bạn có buổi đã xong — hãy viết đánh giá.'
              : 'Cần một buổi đã diễn ra (hết giờ kết thúc) hoặc đã hoàn thành để có thể đánh giá.'}
          </p>
          {bookableSessions.length > 0 && (
            <button type="button" className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={openCreate}>
              Viết đánh giá đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map((r) => {
            const linked = bookingById[r.bookingId];
            return (
            <div key={r.id} className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>{personLabel(r.mentor)}</span>
                    <span style={{ display: 'flex', gap: '2px', color: 'var(--warning)' }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={16} fill={i < r.rating ? 'currentColor' : 'none'} />
                      ))}
                    </span>
                  </div>
                  {linked && (
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <Calendar size={14} />
                      {linked.topic || 'Buổi mentoring'} — {new Date(linked.scheduleStart).toLocaleString('vi-VN')}
                    </div>
                  )}
                  {r.comment && (
                    <p style={{ color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{r.comment}</p>
                  )}
                  {!r.comment && <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem', fontStyle: 'italic' }}>Không có nhận xét</p>}
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                    Mã booking: {r.bookingId.substring(0, 8)}…
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="nav-link"
                    onClick={() => openEdit(r)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Pencil size={16} /> Sửa
                  </button>
                  <button
                    type="button"
                    className="nav-link"
                    onClick={() => void remove(r.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--error)' }}
                  >
                    <Trash2 size={16} /> Xóa
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {createOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-create-title"
        >
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <h2 id="review-create-title" style={{ marginTop: 0 }}>Đánh giá mới</h2>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.875rem' }}>Buổi học</label>
            <select
              className="input-field"
              style={{ width: '100%', marginBottom: '1rem' }}
              value={formBookingId}
              onChange={(e) => onBookingPick(e.target.value)}
            >
              {bookableSessions.map((b) => (
                <option key={b.id} value={b.id}>
                  {(b.topic || 'Session') +
                    ' — ' +
                    new Date(b.scheduleStart).toLocaleString()}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
              Các buổi đã kết thúc (hết giờ) hoặc đã hoàn thành, chưa được bạn đánh giá.
            </p>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Số sao</p>
            <StarRow value={formRating} onChange={setFormRating} />
            <label style={{ display: 'block', margin: '1rem 0 0.35rem', fontSize: '0.875rem' }}>Nhận xét (tuỳ chọn)</label>
            <textarea
              className="input-field"
              style={{ width: '100%', minHeight: '100px', marginBottom: '1.25rem' }}
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn…"
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="nav-link" onClick={() => setCreateOpen(false)} disabled={saving}>
                Hủy
              </button>
              <button type="button" className="btn-primary" onClick={() => void submitCreate()} disabled={saving || !formBookingId}>
                {saving ? 'Đang gửi…' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <h2 style={{ marginTop: 0 }}>Sửa đánh giá</h2>
            <p style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Số sao</p>
            <StarRow value={formRating} onChange={setFormRating} />
            <label style={{ display: 'block', margin: '1rem 0 0.35rem', fontSize: '0.875rem' }}>Nhận xét</label>
            <textarea
              className="input-field"
              style={{ width: '100%', minHeight: '100px', marginBottom: '1.25rem' }}
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="nav-link" onClick={() => setEditId(null)} disabled={saving}>
                Hủy
              </button>
              <button type="button" className="btn-primary" onClick={() => void submitEdit()} disabled={saving}>
                {saving ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
