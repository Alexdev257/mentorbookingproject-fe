import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../api/booking';
import { userApi } from '../../api/services';
import type { SlotResponseDto, BookingResponseDto } from '../../types';
import { BookingStatus } from '../../constants/bookingStatus';
import { Calendar, Inbox, ChevronRight, Clock, Sparkles, Check, X, Loader2, User, Link as LinkIcon, Ban, Star } from 'lucide-react';

const MentorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const first = user?.fullName?.split(/\s+/)[0] ?? 'Mentor';
  const [slots, setSlots] = useState<SlotResponseDto[]>([]);
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [menteeNames, setMenteeNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    const [sRes, bRes] = await Promise.all([
      bookingApi.getMentorSlots(user.id, { includeBooked: true }),
      bookingApi.getMentorBookings(user.id, 1, 80),
    ]);
    if (sRes.isSuccess) setSlots(sRes.data ?? []);
    if (bRes.isSuccess && bRes.data?.items) setBookings(bRes.data.items);
    else if (bRes.isSuccess && !bRes.data?.items?.length) setBookings([]);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        await loadDashboard();
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, loadDashboard]);

  // Poll to make sure pending/confirmed updates show without manual refresh.
  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          await loadDashboard();
        } catch (e) {
          // Keep UI stable; just skip this round.
          console.error('Failed to refetch mentor dashboard:', e);
        }
      })();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [user, loadDashboard]);

  useEffect(() => {
    // Need mentee names for both "pending" (accept/reject) and "confirmed" (cancel).
    const target = bookings.filter(
      (b) => b.status === BookingStatus.Pending || b.status === BookingStatus.Confirmed
    );
    if (!target.length) {
      setMenteeNames({});
      return;
    }
    const ids = [...new Set(target.map((b) => b.menteeId))];
    let alive = true;
    void (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const r = await userApi.getUserById(id);
            if (r.isSuccess && r.data) {
              const name = r.data.fullName?.trim() || r.data.email;
              return [id, name] as const;
            }
          } catch {
            /* ignore */
          }
          return [id, 'Sinh viên'] as const;
        })
      );
      if (alive) setMenteeNames(Object.fromEntries(entries));
    })();
    return () => {
      alive = false;
    };
  }, [bookings]);

  const handleAcceptReject = async (id: string, action: 'accept' | 'reject') => {
    setProcessingId(id);
    try {
      const res = action === 'accept' ? await bookingApi.acceptBooking(id) : await bookingApi.rejectBooking(id);
      if (res.isSuccess) {
        await loadDashboard();
      } else {
        window.alert(res.message || (action === 'accept' ? 'Chấp nhận thất bại' : 'Từ chối thất bại'));
      }
    } catch {
      window.alert('Lỗi mạng hoặc máy chủ.');
    } finally {
      setProcessingId(null);
    }
  };

  const availableSlots = slots.filter((x) => !x.isBooked).length;
  const pendingRequests = bookings.filter((b) => b.status === BookingStatus.Pending).length;
  const acceptedSessions = bookings.filter((b) => b.status === BookingStatus.Confirmed).length;
  const pendingBookingsPreview = bookings.filter((b) => b.status === BookingStatus.Pending).slice(0, 5);
  const confirmedBookingsPreview = bookings.filter((b) => b.status === BookingStatus.Confirmed).slice(0, 5);

  const handleCancelAccepted = async (id: string) => {
    if (!window.confirm('Hủy buổi đã xác nhận? Slot sẽ được mở lại cho sinh viên khác.')) return;
    setProcessingId(id);
    try {
      const res = await bookingApi.cancelBooking(id);
      if (res.isSuccess) {
        await loadDashboard();
      } else {
        window.alert(res.message || 'Hủy lịch thất bại');
      }
    } catch {
      window.alert('Lỗi mạng hoặc máy chủ.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-dash-hero">
        <p className="admin-eyebrow" style={{ color: 'var(--success)' }}>
          Không gian mentor
        </p>
        <h1 className="admin-title">Xin chào, {first}</h1>
        <p className="admin-desc">
          Sinh viên đặt lịch xong sẽ xuất hiện mục <strong>Yêu cầu chờ duyệt</strong> bên dưới và trong menu{' '}
          <strong>Duyệt booking</strong> — bấm <em>Chấp nhận</em> hoặc <em>Từ chối</em>.
        </p>
      </div>

      <div
        className="admin-panel"
        style={{
          padding: '1.25rem 1.35rem',
          marginBottom: '1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          className="admin-shortcut-icon"
          style={{
            background: 'linear-gradient(135deg, rgba(63,185,80,0.22) 0%, rgba(63,185,80,0.08) 100%)',
          }}
        >
          <Sparkles size={26} color="var(--success)" />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Tóm tắt nhanh</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {loading
              ? 'Đang tải số liệu…'
              : `${availableSlots} khung giờ còn trống · ${pendingRequests} yêu cầu chờ duyệt · ${acceptedSessions} buổi đã xác nhận.`}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="mentor-stat-card">
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Khung trống
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--success)' }}>{loading ? '…' : availableSlots}</div>
        </div>
        <div className="mentor-stat-card">
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Chờ duyệt
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--warning)' }}>{loading ? '…' : pendingRequests}</div>
        </div>
        <div className="mentor-stat-card">
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Đã xác nhận
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.35rem' }}>{loading ? '…' : acceptedSessions}</div>
        </div>
      </div>

      {!loading && pendingBookingsPreview.length > 0 && (
        <div className="admin-panel" style={{ marginBottom: '1.75rem', padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Yêu cầu chờ duyệt</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                Duyệt trực tiếp tại đây hoặc mở trang đầy đủ.
              </p>
            </div>
            <Link to="/mentor/bookings" className="admin-btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
              Xem tất cả ({pendingRequests})
            </Link>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Thời gian</th>
                  <th>Chủ đề</th>
                  <th style={{ minWidth: 220 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookingsPreview.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="admin-avatar" style={{ width: 34, height: 34 }}>
                          <User size={16} color="var(--text-secondary)" />
                        </div>
                        <span style={{ fontWeight: 600 }}>{menteeNames[b.menteeId] ?? '…'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {new Date(b.scheduleStart).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{b.topic || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="admin-btn-primary"
                          style={{
                            padding: '0.45rem 0.7rem',
                            fontSize: '0.75rem',
                            background: 'linear-gradient(135deg, #3fb950 0%, #238636 100%)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                          disabled={processingId === b.id}
                          onClick={() => void handleAcceptReject(b.id, 'accept')}
                        >
                          {processingId === b.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={15} />}
                          Chấp nhận
                        </button>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{
                            padding: '0.45rem 0.7rem',
                            fontSize: '0.75rem',
                            borderColor: 'rgba(248,81,73,0.4)',
                            color: '#ff8b87',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                          disabled={processingId === b.id}
                          onClick={() => void handleAcceptReject(b.id, 'reject')}
                        >
                          <X size={15} />
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && confirmedBookingsPreview.length > 0 && (
        <div className="admin-panel" style={{ marginBottom: '1.75rem', padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Đã xác nhận</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                Có thể hủy lịch nếu cần.
              </p>
            </div>
            <span className="admin-chip">{confirmedBookingsPreview.length} buổi</span>
          </div>

          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Thời gian</th>
                  <th>Chủ đề</th>
                  <th style={{ minWidth: 220 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {confirmedBookingsPreview.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="admin-avatar" style={{ width: 34, height: 34 }}>
                          <User size={16} color="var(--text-secondary)" />
                        </div>
                        <span style={{ fontWeight: 600 }}>{menteeNames[b.menteeId] ?? '…'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {new Date(b.scheduleStart).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{b.topic || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {b.meetingLink ? (
                          <a href={b.meetingLink} target="_blank" rel="noopener noreferrer" className="admin-btn-primary" style={{ fontSize: '0.75rem', padding: '0.45rem 0.7rem' }}>
                            <LinkIcon size={14} /> Vào họp
                          </a>
                        ) : null}
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{
                            padding: '0.45rem 0.7rem',
                            fontSize: '0.75rem',
                            borderColor: 'rgba(219,171,9,0.45)',
                            color: 'var(--warning)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                          onClick={() => void handleCancelAccepted(b.id)}
                          disabled={processingId === b.id}
                        >
                          {processingId === b.id ? <Loader2 className="animate-spin" size={14} /> : <Ban size={14} />}
                          Hủy lịch
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="admin-eyebrow" style={{ marginBottom: '0.75rem', color: 'var(--success)' }}>
        Đi tới
      </p>
      <div className="admin-shortcuts">
        <Link to="/mentor/slots" className="mentor-shortcut-card">
          <div
            className="admin-shortcut-icon"
            style={{
              background: 'linear-gradient(135deg, rgba(88,166,255,0.2) 0%, rgba(88,166,255,0.06) 100%)',
            }}
          >
            <Calendar size={26} color="var(--brand-primary)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }}>Lịch trống</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Tạo hoặc gỡ khung giờ để sinh viên có thể đặt lịch.
            </p>
          </div>
          <ChevronRight size={22} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </Link>

        <Link to="/mentor/bookings" className="mentor-shortcut-card">
          <div
            className="admin-shortcut-icon"
            style={{
              background: 'linear-gradient(135deg, rgba(219,171,9,0.2) 0%, rgba(219,171,9,0.06) 100%)',
            }}
          >
            <Inbox size={26} color="var(--warning)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }}>Duyệt booking</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Chấp nhận / từ chối yêu cầu; sau khi chấp nhận có link họp và có thể hủy lịch.
            </p>
          </div>
          <ChevronRight size={22} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </Link>

        <Link to="/mentor/reviews" className="mentor-shortcut-card">
          <div
            className="admin-shortcut-icon"
            style={{
              background: 'linear-gradient(135deg, rgba(210,153,34,0.22) 0%, rgba(210,153,34,0.06) 100%)',
            }}
          >
            <Star size={26} color="var(--warning)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }}>Đánh giá nhận được</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Xem sao và nhận xét từ sinh viên sau các buổi học.
            </p>
          </div>
          <ChevronRight size={22} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </Link>
      </div>

      <div className="admin-panel" style={{ marginTop: '2rem', padding: '1.35rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
          <Clock size={20} color="var(--text-secondary)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Gợi ý</h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Luôn cập nhật lịch sớm và phản hồi yêu cầu trong 24–48h để trải nghiệm mentee tốt hơn. Dùng menu bên trái để chuyển giữa{' '}
          <strong>Tổng quan</strong>, <strong>Lịch trống</strong>, <strong>Duyệt booking</strong> và <strong>Đánh giá nhận được</strong>.
        </p>
      </div>
    </div>
  );
};

export default MentorDashboardPage;
