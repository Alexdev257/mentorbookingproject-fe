import React, { useState, useEffect, useMemo } from 'react';
import { bookingApi } from '../../api/booking';
import { meetingApi } from '../../api/meetings';
import { userApi } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import type { BookingResponseDto, MeetingRecordingDto } from '../../types';
import { Check, X, Calendar, Clock, User, Link as LinkIcon, Loader2, Inbox, Ban } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { BookingStatus } from '../../constants/bookingStatus';
import { MonthCalendar } from '../../components/calendar/MonthCalendar';
import type { MonthCalMarker } from '../../components/calendar/MonthCalendar';
import { isSameLocalDay, startOfMonth, toLocalYmd } from '../../components/calendar/monthUtils';

const statusLabel = (s: number) => {
  if (s === BookingStatus.Pending) return 'Chờ duyệt';
  if (s === BookingStatus.Confirmed) return 'Đã xác nhận';
  if (s === BookingStatus.Rejected) return 'Từ chối';
  if (s === BookingStatus.Cancelled) return 'Đã hủy';
  if (s === BookingStatus.Completed) return 'Hoàn thành';
  return 'Khác';
};

const statusBadgeClass = (s: number) => {
  if (s === BookingStatus.Pending) return 'status-pending';
  if (s === BookingStatus.Confirmed || s === BookingStatus.Completed) return 'status-active';
  return 'status-inactive';
};

function bookingMarker(status: number): { color: string; title: string } {
  switch (status) {
    case BookingStatus.Pending:
      return { color: 'var(--warning, #dbab09)', title: 'Chờ duyệt' };
    case BookingStatus.Confirmed:
    case BookingStatus.Completed:
      return { color: 'var(--success, #3fb950)', title: status === BookingStatus.Completed ? 'Hoàn thành' : 'Đã xác nhận' };
    case BookingStatus.Rejected:
    case BookingStatus.Cancelled:
      return { color: 'var(--text-muted, #8b949e)', title: status === BookingStatus.Rejected ? 'Từ chối' : 'Đã hủy' };
    default:
      return { color: '#888', title: 'Khác' };
  }
}

const BookingRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [menteeNames, setMenteeNames] = useState<Record<string, string>>({});
  const [meetingByBooking, setMeetingByBooking] = useState<Record<string, { joinUrl?: string; recordings: MeetingRecordingDto[] }>>({});
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedFilterDate, setSelectedFilterDate] = useState<Date | null>(null);

  const fetchBookings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const response = await bookingApi.getMentorBookings(user.id, 1, 80);
      if (response.isSuccess && response.data?.items) {
        setBookings(response.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetchBookings = async () => {
    if (!user) return;
    try {
      const response = await bookingApi.getMentorBookings(user.id, 1, 80);
      if (response.isSuccess && response.data?.items) {
        setBookings(response.data.items);
      } else if (response.isSuccess) {
        setBookings([]);
      }
    } catch (err) {
      console.error('Failed to refetch bookings:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    void fetchBookings();
  }, [user]);

  // Poll to make sure new pending bookings appear smoothly without reload.
  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => {
      void refetchBookings();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (!bookings.length) {
      setMenteeNames({});
      return;
    }
    const uniqueMenteeIds = [...new Set(bookings.map((b) => b.menteeId))];
    let alive = true;
    (async () => {
      const entries = await Promise.all(
        uniqueMenteeIds.map(async (id) => {
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

  useEffect(() => {
    const targetBookingIds = bookings
      .filter((b) => b.status === BookingStatus.Confirmed || b.status === BookingStatus.Completed)
      .map((b) => b.id)
      .filter((id) => meetingByBooking[id] === undefined);
    if (!targetBookingIds.length) return;

    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        targetBookingIds.map(async (bookingId) => {
          try {
            const [meetingRes, recordingsRes] = await Promise.all([
              meetingApi.getMeetingByBookingId(bookingId),
              meetingApi.getRecordingsByBookingId(bookingId),
            ]);

            const joinUrl = meetingRes.isSuccess ? meetingRes.data?.joinUrl : undefined;
            const recordings = recordingsRes.isSuccess ? recordingsRes.data ?? [] : [];
            return [bookingId, { joinUrl, recordings }] as const;
          } catch {
            return [bookingId, { joinUrl: undefined, recordings: [] }] as const;
          }
        })
      );
      if (cancelled) return;
      setMeetingByBooking((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    })();

    return () => {
      cancelled = true;
    };
  }, [bookings, meetingByBooking]);

  const markersByDay = useMemo(() => {
    const map: Record<string, MonthCalMarker[]> = {};
    for (const b of bookings) {
      const key = toLocalYmd(new Date(b.scheduleStart));
      if (!map[key]) map[key] = [];
      const m = bookingMarker(b.status);
      map[key].push({ color: m.color, title: m.title });
    }
    return map;
  }, [bookings]);

  const displayedBookings = useMemo(() => {
    if (!selectedFilterDate) return bookings;
    return bookings.filter((b) => isSameLocalDay(b.scheduleStart, selectedFilterDate));
  }, [bookings, selectedFilterDate]);

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    setProcessingId(id);
    try {
      const response = action === 'accept' ? await bookingApi.acceptBooking(id) : await bookingApi.rejectBooking(id);
      if (response.isSuccess) {
        await fetchBookings();
      } else {
        window.alert(response.message || (action === 'accept' ? 'Chấp nhận thất bại' : 'Từ chối thất bại'));
      }
    } catch (err) {
      console.error(`Failed to ${action} booking:`, err);
      window.alert('Lỗi mạng hoặc máy chủ.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelAccepted = async (id: string) => {
    if (!window.confirm('Hủy buổi đã xác nhận? Slot sẽ được mở lại cho sinh viên khác.')) return;
    setProcessingId(id);
    try {
      const response = await bookingApi.cancelBooking(id);
      if (response.isSuccess) {
        await fetchBookings();
      } else {
        window.alert(response.message || 'Hủy lịch thất bại');
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      window.alert('Lỗi mạng hoặc máy chủ.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = bookings.filter((b) => b.status === BookingStatus.Pending).length;

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Mentor"
        title="Yêu cầu đặt lịch"
        description="Đây là trang duyệt booking: Chấp nhận / Từ chối khi còn chờ; sau khi chấp nhận có thể vào link họp hoặc Hủy buổi nếu cần đổi kế hoạch."
        actions={<span className="admin-chip">{loading ? '…' : `${pendingCount} chờ xử lý`}</span>}
      />

      <div className="admin-panel" style={{ padding: '1rem 1.15rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div style={{ fontWeight: 750 }}>Lịch booking</div>
          {selectedFilterDate ? (
            <button type="button" className="admin-btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }} onClick={() => setSelectedFilterDate(null)}>
              Hiển thị tất cả ngày
            </button>
          ) : null}
        </div>
        <MonthCalendar
          visibleMonth={visibleMonth}
          onVisibleMonthChange={(d) => setVisibleMonth(startOfMonth(d))}
          selectedDate={selectedFilterDate}
          onSelectDate={(d) => {
            const x = new Date(d);
            x.setHours(0, 0, 0, 0);
            setSelectedFilterDate(x);
            setVisibleMonth(startOfMonth(x));
          }}
          markersByDay={markersByDay}
        />
        {selectedFilterDate ? (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.85rem' }}>
            Đang lọc: <strong>{selectedFilterDate.toLocaleDateString('vi-VN')}</strong> — {displayedBookings.length} dòng
          </p>
        ) : null}
      </div>

      <div className="admin-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Lịch hẹn</th>
                <th>Nội dung</th>
                <th>Trạng thái</th>
                <th style={{ minWidth: 140 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-skeleton" style={{ padding: '2.5rem' }}>
                      <div className="admin-skeleton-bar" />
                      <div className="admin-skeleton-bar" style={{ maxWidth: 320 }} />
                    </div>
                  </td>
                </tr>
              ) : displayedBookings.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-empty">
                      <div className="admin-empty-icon">
                        <Inbox size={28} />
                      </div>
                      <p style={{ fontWeight: 600 }}>Chưa có yêu cầu</p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.35rem' }}>
                        {selectedFilterDate
                          ? 'Không có booking trong ngày này. Chọn ngày khác hoặc bấm “Hiển thị tất cả ngày”.'
                          : 'Khi sinh viên đặt lịch với bạn, hàng sẽ xuất hiện tại đây.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="admin-avatar" style={{ width: 38, height: 38 }}>
                          <User size={18} color="var(--text-secondary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 650 }}>{menteeNames[booking.menteeId] ?? '…'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID mentee</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.875rem' }}>
                        <Calendar size={15} color="var(--text-muted)" />
                        {new Date(booking.scheduleStart).toLocaleDateString('vi-VN')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                        <Clock size={14} />
                        {new Date(booking.scheduleStart).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} —{' '}
                        {new Date(booking.scheduleEnd).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{booking.topic || '—'}</div>
                      {booking.notes ? (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', maxWidth: 280 }}>{booking.notes}</div>
                      ) : null}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        {booking.priceAmount > 0 ? `${booking.priceAmount.toLocaleString('vi-VN')} ${booking.currency}` : ''}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${statusBadgeClass(booking.status)}`}>
                        {statusLabel(booking.status)}
                      </span>
                    </td>
                    <td>
                        {booking.status === BookingStatus.Pending ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="admin-btn-primary"
                            style={{
                              padding: '0.5rem 0.85rem',
                              fontSize: '0.8125rem',
                              background: 'linear-gradient(135deg, #3fb950 0%, #238636 100%)',
                              boxShadow: '0 2px 12px rgba(63,185,80,0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                            }}
                            onClick={() => handleAction(booking.id, 'accept')}
                            disabled={processingId === booking.id}
                          >
                            {processingId === booking.id ? <Loader2 className="animate-spin" size={16} /> : <Check size={17} />}
                            Chấp nhận
                          </button>
                          <button
                            type="button"
                            className="admin-btn-secondary"
                            style={{
                              padding: '0.5rem 0.85rem',
                              fontSize: '0.8125rem',
                              borderColor: 'rgba(248,81,73,0.4)',
                              color: '#ff8b87',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                            }}
                            onClick={() => handleAction(booking.id, 'reject')}
                            disabled={processingId === booking.id}
                          >
                            <X size={17} />
                            Từ chối
                          </button>
                        </div>
                      ) : booking.status === BookingStatus.Confirmed ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {(booking.meetingLink || meetingByBooking[booking.id]?.joinUrl) ? (
                            <a
                              href={booking.meetingLink || meetingByBooking[booking.id]?.joinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-btn-primary"
                              style={{
                                padding: '0.5rem 0.85rem',
                                fontSize: '0.8125rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <LinkIcon size={15} /> Vào họp
                            </a>
                          ) : null}
                          <button
                            type="button"
                            className="admin-btn-secondary"
                            style={{
                              padding: '0.5rem 0.85rem',
                              fontSize: '0.8125rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              borderColor: 'rgba(219,171,9,0.45)',
                              color: 'var(--warning)',
                            }}
                            onClick={() => void handleCancelAccepted(booking.id)}
                            disabled={processingId === booking.id}
                          >
                            {processingId === booking.id ? <Loader2 className="animate-spin" size={16} /> : <Ban size={16} />}
                            Hủy lịch
                          </button>
                        </div>
                      ) : booking.status === BookingStatus.Completed ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {meetingByBooking[booking.id]?.recordings?.[0]?.storageUrl ? (
                            <a
                              href={meetingByBooking[booking.id].recordings[0].storageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-btn-secondary"
                              style={{
                                padding: '0.5rem 0.85rem',
                                fontSize: '0.8125rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <LinkIcon size={15} /> Xem recording
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Chưa có recording</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingRequestsPage;
