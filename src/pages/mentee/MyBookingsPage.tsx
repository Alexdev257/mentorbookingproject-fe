import React, { useState, useEffect, useMemo } from 'react';
import { bookingApi } from '../../api/booking';
import { meetingApi } from '../../api/meetings';
import { userApi } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import type { BookingResponseDto, MeetingRecordingDto } from '../../types';
import { BookingStatus } from '../../constants/bookingStatus';
import { Calendar, Clock, User, Mail, Loader2, Star, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { MonthCalendar } from '../../components/calendar/MonthCalendar';
import type { MonthCalMarker } from '../../components/calendar/MonthCalendar';
import { isSameLocalDay, startOfMonth, toLocalYmd } from '../../components/calendar/monthUtils';

function statusMarker(status: number): { color: string; title: string } {
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

const MyBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [mentorNames, setMentorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [meetingByBooking, setMeetingByBooking] = useState<Record<string, { joinUrl?: string; recordings: MeetingRecordingDto[] }>>({});

  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedFilterDate, setSelectedFilterDate] = useState<Date | null>(null);

  const fetchBookings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const response = await bookingApi.getMenteeBookings(user.id, 1, 50);
      if (response.isSuccess && response.data?.items) {
        setBookings(response.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  useEffect(() => {
    const ids = [...new Set(bookings.map((b) => b.mentorId))];
    if (ids.length === 0) return;
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await userApi.getUserById(id);
            if (res.isSuccess && res.data) {
              return [id, res.data.fullName] as const;
            }
          } catch {
            /* ignore */
          }
          return [id, ''] as const;
        })
      );
      if (cancelled) return;
      setMentorNames((prev) => {
        const next = { ...prev };
        for (const [id, name] of entries) {
          if (name) next[id] = name;
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
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
      const m = statusMarker(b.status);
      map[key].push({ color: m.color, title: m.title });
    }
    return map;
  }, [bookings]);

  const displayedBookings = useMemo(() => {
    if (!selectedFilterDate) return bookings;
    return bookings.filter((b) => isSameLocalDay(b.scheduleStart, selectedFilterDate));
  }, [bookings, selectedFilterDate]);

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Hủy yêu cầu đặt lịch này?')) return;
    setCancellingId(bookingId);
    try {
      const res = await bookingApi.cancelBooking(bookingId);
      if (res.isSuccess) {
        await fetchBookings();
      } else {
        alert(res.message || 'Không hủy được lịch');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi khi hủy lịch');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusDisplay = (status: number) => {
    switch (status) {
      case BookingStatus.Pending:
        return { label: 'Chờ duyệt', class: 'status-pending', icon: <Clock size={14} /> };
      case BookingStatus.Confirmed:
        return { label: 'Đã xác nhận', class: 'status-active', icon: <CheckCircle2 size={14} /> };
      case BookingStatus.Rejected:
        return { label: 'Từ chối', class: 'status-inactive', icon: <XCircle size={14} /> };
      case BookingStatus.Cancelled:
        return { label: 'Đã hủy', class: 'status-inactive', icon: <AlertCircle size={14} /> };
      case BookingStatus.Completed:
        return { label: 'Hoàn thành', class: 'status-active', icon: <CheckCircle2 size={14} /> };
      default:
        return { label: 'Khác', class: 'status-inactive', icon: null };
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1>My Bookings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Xem lịch theo tháng; bấm một ngày để lọc danh sách bên dưới.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-card" style={{ padding: '5rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Calendar size={40} color="var(--text-muted)" />
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>No Bookings Yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>You haven't requested any sessions yet. Browse mentors to get started!</p>
          <a href="/mentee/browse" className="btn-primary">
            Find a Mentor
          </a>
        </div>
      ) : (
        <>
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Lịch booking</span>
              {selectedFilterDate ? (
                <button type="button" className="nav-link" style={{ fontSize: '0.875rem' }} onClick={() => setSelectedFilterDate(null)}>
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
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem', lineHeight: 1.45 }}>
              Chấm màu theo trạng thái. Khi đã xác nhận, link họp được gửi qua email.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {selectedFilterDate ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Ngày {selectedFilterDate.toLocaleDateString('vi-VN')}: <strong>{displayedBookings.length}</strong> buổi
              </p>
            ) : null}
            {displayedBookings.map((booking) => {
              const status = getStatusDisplay(booking.status);
              return (
                <div
                  key={booking.id}
                  className="glass-card"
                  style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', transition: 'var(--transition)' }}
                >
                  <div style={{ width: 60, height: 60, borderRadius: 'var(--radius-md)', background: 'rgba(88, 166, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={30} color="var(--brand-primary)" />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.125rem' }}>{booking.topic || 'Mentoring Session'}</h3>
                      <span className={`status-badge ${status.class}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {status.icon} {status.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} /> {new Date(booking.scheduleStart).toLocaleDateString()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} />
                        {new Date(booking.scheduleStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                        {new Date(booking.scheduleEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Star size={14} />
                        {mentorNames[booking.mentorId] || `Mentor ${booking.mentorId.substring(0, 8)}…`}
                      </div>
                    </div>
                    {booking.status === BookingStatus.Confirmed && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          maxWidth: 520,
                        }}
                      >
                        <Mail size={16} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>
                          {booking.meetingLink || meetingByBooking[booking.id]?.joinUrl
                            ? (
                              <>
                                Link tham gia: <a href={booking.meetingLink || meetingByBooking[booking.id]?.joinUrl} target="_blank" rel="noopener noreferrer">mở phòng họp</a>.
                              </>
                            )
                            : 'Link tham gia cuộc họp đã được gửi qua email của bạn. Vui lòng kiểm tra hộp thư (kể cả thư mục spam).'}
                        </span>
                      </div>
                    )}
                    {booking.status === BookingStatus.Completed && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {meetingByBooking[booking.id]?.recordings?.[0]?.storageUrl ? (
                          <a href={meetingByBooking[booking.id].recordings[0].storageUrl} target="_blank" rel="noopener noreferrer">
                            Xem recording buổi học
                          </a>
                        ) : (
                          'Chưa có recording cho buổi này.'
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {(booking.status === BookingStatus.Pending || booking.status === BookingStatus.Confirmed) && (
                      <button
                        type="button"
                        className="nav-link"
                        style={{ color: 'var(--error)' }}
                        disabled={cancellingId === booking.id}
                        onClick={() => void handleCancel(booking.id)}
                      >
                        {cancellingId === booking.id
                          ? 'Đang hủy…'
                          : booking.status === BookingStatus.Pending
                            ? 'Hủy yêu cầu'
                            : 'Hủy lịch'}
                      </button>
                    )}
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

export default MyBookingsPage;
