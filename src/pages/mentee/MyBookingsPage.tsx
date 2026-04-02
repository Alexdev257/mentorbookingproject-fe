import React, { useState, useEffect, useMemo } from 'react';
import { bookingApi } from '../../api/booking';
import { meetingApi } from '../../api/meetings';
import { userApi } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import type { BookingResponseDto, MeetingRecordingDto } from '../../types';
import { BookingStatus } from '../../constants/bookingStatus';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Loader2,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { MonthCalendar } from '../../components/calendar/MonthCalendar';
import type { MonthCalMarker } from '../../components/calendar/MonthCalendar';
import { isSameLocalDay, startOfMonth, toLocalYmd } from '../../components/calendar/monthUtils';

function statusMarker(status: number): { color: string; title: string } {
  switch (status) {
    case BookingStatus.Pending:
      return { color: 'var(--warning, #dbab09)', title: 'Chờ duyệt' };
    case BookingStatus.Confirmed:
    case BookingStatus.Completed:
      return {
        color: 'var(--success, #3fb950)',
        title: status === BookingStatus.Completed ? 'Hoàn thành' : 'Đã xác nhận',
      };
    case BookingStatus.Rejected:
    case BookingStatus.Cancelled:
      return {
        color: 'var(--text-muted, #8b949e)',
        title: status === BookingStatus.Rejected ? 'Từ chối' : 'Đã hủy',
      };
    default:
      return { color: '#888', title: 'Khác' };
  }
}

const myBookingsWorkspaceCss = `
.my-bookings-workspace {
  --mbw-bg: #f5f6fb;
  --mbw-surface: #ffffff;
  --mbw-surface-soft: #f8f8fc;
  --mbw-border: #ececf3;
  --mbw-text: #17181c;
  --mbw-muted: #7b7f8f;
  --mbw-purple: #7b61ff;
  --mbw-purple-strong: #6a4df6;
  --mbw-purple-soft: rgba(123, 97, 255, 0.12);
  --mbw-green: #23b26d;
  --mbw-green-soft: rgba(35, 178, 109, 0.12);
  --mbw-yellow: #d7a316;
  --mbw-yellow-soft: rgba(215, 163, 22, 0.14);
  --mbw-red: #ef5b5b;
  --mbw-red-soft: rgba(239, 91, 91, 0.12);
  --mbw-shadow: 0 18px 45px rgba(28, 32, 48, 0.06);
  color: var(--mbw-text);
}

.my-bookings-workspace .mbw-shell {
  background: var(--mbw-bg);
  border: 1px solid var(--mbw-border);
  border-radius: 28px;
  padding: 1.25rem;
  box-shadow: var(--mbw-shadow);
}

.my-bookings-workspace .mbw-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0.25rem 1rem;
  border-bottom: 1px solid var(--mbw-border);
  margin-bottom: 1rem;
}

.my-bookings-workspace .mbw-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.my-bookings-workspace .mbw-brand-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--mbw-purple) 0%, var(--mbw-purple-strong) 100%);
  box-shadow: 0 8px 22px rgba(123, 97, 255, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 1rem;
}

.my-bookings-workspace .mbw-brand-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
  color: #111111;
}

.my-bookings-workspace .mbw-brand-sub {
  margin: 0.16rem 0 0;
  color: var(--mbw-muted);
  font-size: 0.88rem;
}

.my-bookings-workspace .mbw-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  border-radius: 16px;
  background: var(--mbw-surface);
  border: 1px solid var(--mbw-border);
  color: var(--mbw-muted);
  font-size: 0.88rem;
  font-weight: 600;
}

.my-bookings-workspace .mbw-hero {
  background: var(--mbw-surface);
  border: 1px solid var(--mbw-border);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(21, 26, 38, 0.04);
  padding: 1.4rem;
  margin-bottom: 1rem;
}

.my-bookings-workspace .mbw-hero-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.my-bookings-workspace .mbw-hero-title {
  margin: 0 0 0.55rem;
  font-size: 2rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #111111;
}

.my-bookings-workspace .mbw-hero-desc {
  margin: 0;
  color: var(--mbw-muted);
  font-size: 0.98rem;
  max-width: 48rem;
}

.my-bookings-workspace .mbw-hero-tag {
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: var(--mbw-purple-soft);
  color: var(--mbw-purple-strong);
  border: 1px solid rgba(123, 97, 255, 0.18);
  font-weight: 700;
  font-size: 0.84rem;
  white-space: nowrap;
}

.my-bookings-workspace .mbw-loading {
  text-align: center;
  padding: 5rem;
}

.my-bookings-workspace .mbw-empty-card,
.my-bookings-workspace .mbw-calendar-card,
.my-bookings-workspace .mbw-booking-card {
  background: var(--mbw-surface);
  border: 1px solid var(--mbw-border);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(21, 26, 38, 0.04);
}

.my-bookings-workspace .mbw-empty-card {
  padding: 5rem;
  text-align: center;
}

.my-bookings-workspace .mbw-empty-icon {
  background: var(--mbw-surface-soft);
  width: 80px;
  height: 80px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  border: 1px solid var(--mbw-border);
}

.my-bookings-workspace .mbw-empty-title {
  margin: 0 0 0.5rem;
  color: #111111;
  font-size: 1.15rem;
  font-weight: 700;
}

.my-bookings-workspace .mbw-empty-sub {
  color: var(--mbw-muted);
  margin: 0 0 2rem;
}

.my-bookings-workspace .mbw-primary-link {
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
  text-decoration: none;
  box-shadow: 0 12px 26px rgba(123, 97, 255, 0.22);
}

.my-bookings-workspace .mbw-calendar-card {
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.my-bookings-workspace .mbw-calendar-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.my-bookings-workspace .mbw-calendar-title {
  font-weight: 700;
  font-size: 0.95rem;
  color: #111111;
}

.my-bookings-workspace .mbw-filter-clear {
  border: none;
  background: transparent;
  color: var(--mbw-purple-strong);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.my-bookings-workspace .mbw-calendar-note {
  font-size: 0.75rem;
  color: var(--mbw-muted);
  margin-top: 0.85rem;
  line-height: 1.45;
}

.my-bookings-workspace .mbw-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.my-bookings-workspace .mbw-filter-result {
  font-size: 0.875rem;
  color: var(--mbw-muted);
  margin: 0;
}

.my-bookings-workspace .mbw-booking-card {
  padding: 1.35rem;
  display: flex;
  align-items: center;
  gap: 1.4rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.my-bookings-workspace .mbw-booking-card:hover {
  transform: translateY(-2px);
  border-color: rgba(123, 97, 255, 0.18);
  box-shadow: 0 16px 34px rgba(123, 97, 255, 0.09);
}

.my-bookings-workspace .mbw-booking-avatar {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: linear-gradient(135deg, #f1e9ff 0%, #ece8ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(123, 97, 255, 0.14);
}

.my-bookings-workspace .mbw-booking-main {
  flex: 1;
  min-width: 0;
}

.my-bookings-workspace .mbw-booking-head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.65rem;
  flex-wrap: wrap;
}

.my-bookings-workspace .mbw-booking-title {
  margin: 0;
  font-size: 1.06rem;
  color: #111111;
  font-weight: 700;
}

.my-bookings-workspace .mbw-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.38rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.my-bookings-workspace .mbw-status-badge.status-pending {
  background: var(--mbw-yellow-soft);
  color: #9a6d00;
  border-color: rgba(215, 163, 22, 0.18);
}

.my-bookings-workspace .mbw-status-badge.status-active {
  background: var(--mbw-green-soft);
  color: #14814e;
  border-color: rgba(35, 178, 109, 0.16);
}

.my-bookings-workspace .mbw-status-badge.status-inactive {
  background: rgba(148, 163, 184, 0.14);
  color: #64748b;
  border-color: rgba(148, 163, 184, 0.18);
}

.my-bookings-workspace .mbw-booking-meta {
  display: flex;
  gap: 1.3rem;
  font-size: 0.875rem;
  color: var(--mbw-muted);
  flex-wrap: wrap;
}

.my-bookings-workspace .mbw-booking-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.my-bookings-workspace .mbw-extra {
  margin-top: 0.8rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--mbw-muted);
  line-height: 1.5;
  max-width: 520px;
}

.my-bookings-workspace .mbw-extra svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--mbw-purple);
}

.my-bookings-workspace .mbw-extra a {
  color: var(--mbw-purple-strong);
  font-weight: 600;
  text-decoration: none;
}

.my-bookings-workspace .mbw-actions {
  display: flex;
  gap: 1rem;
  align-self: flex-start;
}

.my-bookings-workspace .mbw-cancel-btn {
  border: none;
  background: transparent;
  color: var(--mbw-red);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
}

@media (max-width: 840px) {
  .my-bookings-workspace .mbw-booking-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .my-bookings-workspace .mbw-actions {
    width: 100%;
  }
}

@media (max-width: 760px) {
  .my-bookings-workspace .mbw-shell {
    border-radius: 20px;
    padding: 0.9rem;
  }

  .my-bookings-workspace .mbw-topbar,
  .my-bookings-workspace .mbw-hero-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .my-bookings-workspace .mbw-hero-title {
    font-size: 1.65rem;
  }

  .my-bookings-workspace .mbw-empty-card {
    padding: 3rem 1.25rem;
  }
}
`;

const MyBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [mentorNames, setMentorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [meetingByBooking, setMeetingByBooking] = useState<
    Record<string, { joinUrl?: string; recordings: MeetingRecordingDto[] }>
  >({});

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
    <>
      <style>{myBookingsWorkspaceCss}</style>

      <div className="animate-fade-in my-bookings-workspace">
        <div>
          <div className="mbw-topbar">
            <div className="mbw-brand">
              <div className="mbw-brand-badge">B</div>
              <div>
                <p className="mbw-brand-title">Booking History</p>
                <p className="mbw-brand-sub">Calendar and session tracking</p>
              </div>
            </div>

            <div className="mbw-chip">
              <Calendar size={16} strokeWidth={1.9} />
              Booking workspace
            </div>
          </div>

          <div className="mbw-hero">
            <div className="mbw-hero-head">
              <div>
                <h1 className="mbw-hero-title">My Bookings</h1>
                <p className="mbw-hero-desc">
                  Xem lịch theo tháng; bấm một ngày để lọc danh sách bên dưới.
                </p>
              </div>

              <div className="mbw-hero-tag">Session overview</div>
            </div>
          </div>

          {loading ? (
            <div className="mbw-loading">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : bookings.length === 0 ? (
            <div className="mbw-empty-card">
              <div className="mbw-empty-icon">
                <Calendar size={40} color="var(--mbw-muted)" />
              </div>
              <h3 className="mbw-empty-title">No Bookings Yet</h3>
              <p className="mbw-empty-sub">
                You haven't requested any sessions yet. Browse mentors to get started!
              </p>
              <a href="/mentee/browse" className="mbw-primary-link">
                Find a Mentor
              </a>
            </div>
          ) : (
            <>
              <div className="mbw-calendar-card">
                <div className="mbw-calendar-head">
                  <span className="mbw-calendar-title">Lịch booking</span>
                  {selectedFilterDate ? (
                    <button
                      type="button"
                      className="mbw-filter-clear"
                      onClick={() => setSelectedFilterDate(null)}
                    >
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

                <p className="mbw-calendar-note">
                  Chấm màu theo trạng thái. Khi đã xác nhận, link họp được gửi qua email.
                </p>
              </div>

              <div className="mbw-list">
                {selectedFilterDate ? (
                  <p className="mbw-filter-result">
                    Ngày {selectedFilterDate.toLocaleDateString('vi-VN')}: <strong>{displayedBookings.length}</strong>{' '}
                    buổi
                  </p>
                ) : null}

                {displayedBookings.map((booking) => {
                  const status = getStatusDisplay(booking.status);
                  return (
                    <div key={booking.id} className="mbw-booking-card">
                      <div className="mbw-booking-avatar">
                        <User size={28} color="var(--mbw-purple)" />
                      </div>

                      <div className="mbw-booking-main">
                        <div className="mbw-booking-head">
                          <h3 className="mbw-booking-title">{booking.topic || 'Mentoring Session'}</h3>
                          <span className={`mbw-status-badge ${status.class}`}>
                            {status.icon} {status.label}
                          </span>
                        </div>

                        <div className="mbw-booking-meta">
                          <div className="mbw-booking-meta-item">
                            <Calendar size={14} />
                            {new Date(booking.scheduleStart).toLocaleDateString()}
                          </div>
                          <div className="mbw-booking-meta-item">
                            <Clock size={14} />
                            {new Date(booking.scheduleStart).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -
                            {new Date(booking.scheduleEnd).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="mbw-booking-meta-item">
                            <Star size={14} />
                            {mentorNames[booking.mentorId] ||
                              `Mentor ${booking.mentorId.substring(0, 8)}…`}
                          </div>
                        </div>

                        {booking.status === BookingStatus.Confirmed && (
                          <div className="mbw-extra">
                            <Mail size={16} />
                            <span>
                              {booking.meetingLink || meetingByBooking[booking.id]?.joinUrl ? (
                                <>
                                  Link tham gia:{' '}
                                  <a
                                    href={booking.meetingLink || meetingByBooking[booking.id]?.joinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    mở phòng họp
                                  </a>
                                  .
                                </>
                              ) : (
                                'Link tham gia cuộc họp đã được gửi qua email của bạn. Vui lòng kiểm tra hộp thư (kể cả thư mục spam).'
                              )}
                            </span>
                          </div>
                        )}

                        {booking.status === BookingStatus.Completed && (
                          <div className="mbw-extra">
                            <Mail size={16} />
                            <span>
                              {meetingByBooking[booking.id]?.recordings?.[0]?.storageUrl ? (
                                <a
                                  href={meetingByBooking[booking.id].recordings[0].storageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Xem recording buổi học
                                </a>
                              ) : (
                                'Chưa có recording cho buổi này.'
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mbw-actions">
                        {(booking.status === BookingStatus.Pending ||
                          booking.status === BookingStatus.Confirmed) && (
                          <button
                            type="button"
                            className="mbw-cancel-btn"
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
      </div>
    </>
  );
};

export default MyBookingsPage;