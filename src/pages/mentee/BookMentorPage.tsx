import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingApi } from '../../api/booking';
import { mentorsApi } from '../../api/services';
import type { TeacherResponseDto, SlotResponseDto } from '../../types';
import { Calendar, UserPlus, Info, CheckCircle, Loader2, Plus, X } from 'lucide-react';
import { MonthCalendar } from '../../components/calendar/MonthCalendar';
import type { MonthCalMarker } from '../../components/calendar/MonthCalendar';
import {
  isDateInMonthGrid,
  isSameLocalDay,
  startOfMonth,
  toLocalYmd,
  visibleGridUtcRange,
} from '../../components/calendar/monthUtils';

const bookMentorWorkspaceCss = `
.book-mentor-workspace {
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
  --bmw-red-soft: rgba(239, 91, 91, 0.12);
  --bmw-shadow: 0 18px 45px rgba(28, 32, 48, 0.06);
  color: var(--bmw-text);
}

.book-mentor-workspace .book-shell {
  background: var(--bmw-bg);
  border: 1px solid var(--bmw-border);
  border-radius: 28px;
  padding: 1.25rem;
  box-shadow: var(--bmw-shadow);
}

.book-mentor-workspace .book-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0.25rem 1rem;
  border-bottom: 1px solid var(--bmw-border);
  margin-bottom: 1rem;
}

.book-mentor-workspace .book-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.book-mentor-workspace .book-brand-badge {
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

.book-mentor-workspace .book-brand-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
  color: #111111;
}

.book-mentor-workspace .book-brand-sub {
  margin: 0.16rem 0 0;
  color: var(--bmw-muted);
  font-size: 0.88rem;
}

.book-mentor-workspace .book-chip {
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

.book-mentor-workspace .book-hero {
  background: var(--bmw-surface);
  border: 1px solid var(--bmw-border);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(21, 26, 38, 0.04);
  padding: 1.4rem;
  margin-bottom: 1rem;
}

.book-mentor-workspace .book-hero-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.book-mentor-workspace .book-hero-title {
  margin: 0 0 0.55rem;
  font-size: 2rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #111111;
}

.book-mentor-workspace .book-hero-desc {
  margin: 0;
  color: var(--bmw-muted);
  font-size: 0.98rem;
  max-width: 48rem;
}

.book-mentor-workspace .book-hero-tag {
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: var(--bmw-purple-soft);
  color: var(--bmw-purple-strong);
  border: 1px solid rgba(123, 97, 255, 0.18);
  font-weight: 700;
  font-size: 0.84rem;
  white-space: nowrap;
}

.book-mentor-workspace .book-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 1rem;
}

.book-mentor-workspace .book-main,
.book-mentor-workspace .book-side {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.book-mentor-workspace .book-card {
  background: var(--bmw-surface);
  border: 1px solid var(--bmw-border);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(21, 26, 38, 0.04);
  overflow: hidden;
}

.book-mentor-workspace .book-card-body {
  padding: 1.35rem;
}

.book-mentor-workspace .book-card-title {
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 1.02rem;
  color: #111111;
}

.book-mentor-workspace .book-card-title svg {
  color: var(--bmw-purple);
}

.book-mentor-workspace .book-muted-note {
  font-size: 0.78rem;
  color: var(--bmw-muted);
  margin-top: 0.9rem;
  line-height: 1.5;
}

.book-mentor-workspace .book-slots-loading,
.book-mentor-workspace .book-slots-message {
  margin-top: 1.2rem;
  color: var(--bmw-muted);
  font-size: 0.92rem;
}

.book-mentor-workspace .book-slots-loading {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.book-mentor-workspace .book-slots-head {
  font-size: 0.82rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--bmw-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.book-mentor-workspace .book-slots-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.book-mentor-workspace .book-slot-btn {
  padding: 0.72rem 0.95rem;
  border-radius: 14px;
  border: 1px solid var(--bmw-border);
  background: var(--bmw-surface-soft);
  color: var(--bmw-text);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
  transition: all 0.18s ease;
}

.book-mentor-workspace .book-slot-btn:hover {
  border-color: rgba(123, 97, 255, 0.28);
  background: rgba(123, 97, 255, 0.06);
}

.book-mentor-workspace .book-slot-btn.is-active {
  border: 2px solid var(--bmw-purple);
  background: rgba(123, 97, 255, 0.12);
  color: #2c1d7a;
  font-weight: 700;
}

.book-mentor-workspace .book-form-stack {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.book-mentor-workspace .book-field label {
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: block;
  color: #111111;
}

.book-mentor-workspace .book-field .input-field {
  background: var(--bmw-surface-soft);
  border: 1px solid var(--bmw-border);
  border-radius: 16px;
  color: var(--bmw-text);
  box-shadow: none;
}

.book-mentor-workspace .book-field .input-field:focus {
  outline: none;
  border-color: rgba(123, 97, 255, 0.35);
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(123, 97, 255, 0.12);
}

.book-mentor-workspace .book-field textarea.input-field {
  min-height: 110px;
  resize: vertical;
}

.book-mentor-workspace .book-profile {
  text-align: center;
}

.book-mentor-workspace .book-profile-avatar {
  width: 88px;
  height: 88px;
  border-radius: 24px;
  background: linear-gradient(135deg, #f1e9ff 0%, #ece8ff 100%);
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bmw-purple);
  font-weight: 800;
  font-size: 1.6rem;
  overflow: hidden;
  box-shadow: 0 12px 26px rgba(123, 97, 255, 0.12);
  border: 4px solid #ffffff;
}

.book-mentor-workspace .book-profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-mentor-workspace .book-profile-name {
  margin: 0 0 0.25rem;
  color: #111111;
  font-size: 1.08rem;
  font-weight: 700;
}

.book-mentor-workspace .book-profile-spec {
  color: var(--bmw-muted);
  font-size: 0.9rem;
  margin: 0;
}

.book-mentor-workspace .book-invite-sub {
  font-size: 0.78rem;
  color: var(--bmw-muted);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.book-mentor-workspace .book-invite-row {
  display: flex;
  gap: 0.55rem;
  margin-bottom: 1rem;
}

.book-mentor-workspace .book-invite-row .input-field {
  flex: 1;
  background: var(--bmw-surface-soft);
  border: 1px solid var(--bmw-border);
  border-radius: 16px;
  color: var(--bmw-text);
  box-shadow: none;
}

.book-mentor-workspace .book-invite-row .input-field:focus {
  outline: none;
  border-color: rgba(123, 97, 255, 0.35);
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(123, 97, 255, 0.12);
}

.book-mentor-workspace .book-add-btn {
  min-width: 48px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #7b61ff 0%, #6a4df6 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 26px rgba(123, 97, 255, 0.22);
}

.book-mentor-workspace .book-emails {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.book-mentor-workspace .book-email-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: var(--bmw-surface-soft);
  border: 1px solid var(--bmw-border);
  padding: 0.7rem 0.85rem;
  border-radius: 16px;
  font-size: 0.84rem;
  color: var(--bmw-text);
}

.book-mentor-workspace .book-email-chip span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-mentor-workspace .book-email-remove {
  background: transparent;
  color: var(--bmw-muted);
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.book-mentor-workspace .book-submit-btn {
  width: 100%;
  min-height: 52px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #7b61ff 0%, #6a4df6 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  font-weight: 700;
  padding: 1rem;
  box-shadow: 0 14px 28px rgba(123, 97, 255, 0.24);
}

.book-mentor-workspace .book-submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  box-shadow: none;
}

.book-mentor-workspace .book-loading,
.book-mentor-workspace .book-empty {
  text-align: center;
  padding: 5rem;
  color: var(--bmw-text);
}

@media (max-width: 980px) {
  .book-mentor-workspace .book-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .book-mentor-workspace .book-shell {
    border-radius: 20px;
    padding: 0.9rem;
  }

  .book-mentor-workspace .book-topbar,
  .book-mentor-workspace .book-hero-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .book-mentor-workspace .book-hero-title {
    font-size: 1.65rem;
  }

  .book-mentor-workspace .book-invite-row {
    flex-direction: column;
  }

  .book-mentor-workspace .book-add-btn {
    min-height: 46px;
    width: 100%;
  }
}
`;

const BookMentorPage: React.FC = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState<TeacherResponseDto | null>(null);
  const [mentorAccountId, setMentorAccountId] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotResponseDto[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [participantEmails, setParticipantEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [didAutoPickDay, setDidAutoPickDay] = useState(false);

  useEffect(() => {
    const fetchMentor = async () => {
      if (!mentorId) return;
      setLoading(true);
      setDidAutoPickDay(false);
      setSelectedDay(null);
      setSelectedSlot(null);
      setSlots([]);
      try {
        const mentorRes = await mentorsApi.getById(mentorId);
        if (!mentorRes.isSuccess || !mentorRes.data) {
          setMentor(null);
          setMentorAccountId(null);
          return;
        }
        setMentor(mentorRes.data);
        setMentorAccountId(mentorRes.data.userId);
      } catch (err) {
        console.error('Failed to fetch mentor:', err);
        setMentor(null);
        setMentorAccountId(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchMentor();
  }, [mentorId]);

  const loadSlotsForMonth = useCallback(
    async (accountId: string, monthAnchor: Date) => {
      const { fromIso, toIso } = visibleGridUtcRange(monthAnchor);
      setSlotsLoading(true);
      try {
        const slotsRes = await bookingApi.getMentorSlots(accountId, {
          from: fromIso,
          to: toIso,
        });
        if (slotsRes.isSuccess) {
          setSlots((slotsRes.data ?? []).filter((s) => !s.isBooked));
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error('Failed to fetch slots:', err);
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!mentorAccountId) return;
    void loadSlotsForMonth(mentorAccountId, visibleMonth);
  }, [mentorAccountId, visibleMonth, loadSlotsForMonth]);

  useEffect(() => {
    if (!selectedDay) return;
    if (!isDateInMonthGrid(selectedDay, visibleMonth)) {
      setSelectedDay(null);
      setSelectedSlot(null);
    }
  }, [visibleMonth, selectedDay]);

  useEffect(() => {
    if (didAutoPickDay || slots.length === 0) return;
    const earliest = slots.reduce(
      (min, s) => {
        const t = new Date(s.startAt).getTime();
        return t < min.t ? { t, s } : min;
      },
      { t: Infinity as number, s: slots[0] }
    );
    if (earliest.t === Infinity) return;
    const d = new Date(earliest.s.startAt);
    d.setHours(0, 0, 0, 0);
    setSelectedDay(d);
    setVisibleMonth(startOfMonth(d));
    setDidAutoPickDay(true);
  }, [slots, didAutoPickDay]);

  const markersByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of slots) {
      const key = toLocalYmd(new Date(s.startAt));
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const map: Record<string, MonthCalMarker[]> = {};
    for (const [key, n] of Object.entries(counts)) {
      map[key] = [
        {
          color: 'var(--success, #3fb950)',
          title: n === 1 ? '1 khung giờ trống' : `${n} khung giờ trống`,
        },
      ];
    }
    return map;
  }, [slots]);

  const slotsOnSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return [...slots]
      .filter((s) => isSameLocalDay(s.startAt, selectedDay))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [slots, selectedDay]);

  useEffect(() => {
    if (!selectedSlot) return;
    const still = slots.some((s) => s.id === selectedSlot);
    if (!still) setSelectedSlot(null);
  }, [slots, selectedSlot]);

  useEffect(() => {
    if (!selectedSlot || !selectedDay) return;
    const slot = slots.find((s) => s.id === selectedSlot);
    if (slot && !isSameLocalDay(slot.startAt, selectedDay)) setSelectedSlot(null);
  }, [selectedDay, selectedSlot, slots]);

  const addEmail = () => {
    if (newEmail && !participantEmails.includes(newEmail)) {
      setParticipantEmails([...participantEmails, newEmail]);
      setNewEmail('');
    }
  };

  const removeEmail = (email: string) => {
    setParticipantEmails(participantEmails.filter((e) => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !mentor) return alert('Vui lòng chọn một khung giờ trống trên lịch.');

    const slot = slots.find((s) => s.id === selectedSlot);
    if (!slot) return alert('Không tìm thấy slot đã chọn.');

    const hasInvites = participantEmails.filter(Boolean).length > 0;
    setSubmitting(true);
    try {
      const response = await bookingApi.createBooking({
        mentorId: slot.mentorId,
        slotId: selectedSlot,
        topic,
        notes,
        invitedEmails: hasInvites ? participantEmails.filter(Boolean) : undefined,
      });
      if (response.isSuccess) {
        alert('Đã gửi yêu cầu đặt lịch! Mentor sẽ xem xét.');
        navigate('/mentee/bookings');
      }
    } catch (err) {
      console.error('Failed to book:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <>
        <style>{bookMentorWorkspaceCss}</style>
        <div className="book-mentor-workspace">
          <div className="book-loading">
            <Loader2 className="animate-spin" size={32} />
          </div>
        </div>
      </>
    );

  if (!mentor)
    return (
      <>
        <style>{bookMentorWorkspaceCss}</style>
        <div className="book-mentor-workspace">
          <div className="book-empty">Không tìm thấy mentor.</div>
        </div>
      </>
    );

  return (
    <>
      <style>{bookMentorWorkspaceCss}</style>

      <div className="animate-fade-in book-mentor-workspace" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div>
          <div className="book-topbar">
            <div className="book-brand">
              <div className="book-brand-badge">B</div>
              <div>
                <p className="book-brand-title">Booking Workspace</p>
                <p className="book-brand-sub">Create a mentoring session</p>
              </div>
            </div>

            <div className="book-chip">
              <Calendar size={16} strokeWidth={1.9} />
              Booking flow
            </div>
          </div>

          <div className="book-hero">
            <div className="book-hero-head">
              <div>
                <h1 className="book-hero-title">Đặt lịch</h1>
                <p className="book-hero-desc">
                  Xem lịch theo tháng: ngày có chấm xanh là còn slot trống. Chọn ngày rồi chọn giờ cụ thể.
                </p>
              </div>

              <div className="book-hero-tag">Mentor booking</div>
            </div>
          </div>

          <div className="book-grid">
            <div className="book-main">
              <div className="book-card">
                <div className="book-card-body">
                  <h3 className="book-card-title">
                    <Calendar size={20} /> 1. Chọn ngày &amp; giờ với {mentor.fullName}
                  </h3>

                  <MonthCalendar
                    visibleMonth={visibleMonth}
                    onVisibleMonthChange={(d) => setVisibleMonth(startOfMonth(d))}
                    selectedDate={selectedDay}
                    onSelectDate={(d) => {
                      const x = new Date(d);
                      x.setHours(0, 0, 0, 0);
                      setSelectedDay(x);
                      setDidAutoPickDay(true);
                    }}
                    markersByDay={markersByDay}
                  />

                  <p className="book-muted-note">
                    Chấm xanh: còn slot trống. Đổi tháng để tải thêm lịch trống (theo khung hiển thị).
                  </p>

                  {slotsLoading ? (
                    <div className="book-slots-loading">
                      <Loader2 className="animate-spin" size={18} /> Đang tải slot…
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="book-slots-message">
                      Không có slot trống trong khung tháng này. Thử chuyển sang tháng khác.
                    </p>
                  ) : !selectedDay ? (
                    <p className="book-slots-message">
                      Bấm một ngày có chấm xanh để xem giờ cụ thể.
                    </p>
                  ) : slotsOnSelectedDay.length === 0 ? (
                    <p className="book-slots-message">
                      Không còn slot trống vào {selectedDay.toLocaleDateString('vi-VN')}. Chọn ngày khác.
                    </p>
                  ) : (
                    <div style={{ marginTop: '1.25rem' }}>
                      <div className="book-slots-head">
                        Giờ trống —{' '}
                        {selectedDay.toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </div>

                      <div className="book-slots-wrap">
                        {slotsOnSelectedDay.map((slot) => {
                          const start = new Date(slot.startAt);
                          const end = new Date(slot.endAt);
                          const label = `${start.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })} – ${end.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`;
                          const active = selectedSlot === slot.id;

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlot(slot.id)}
                              className={`book-slot-btn ${active ? 'is-active' : ''}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="book-card">
                <div className="book-card-body">
                  <h3 className="book-card-title">
                    <Info size={20} /> 2. Nội dung buổi
                  </h3>

                  <div className="book-form-stack">
                    <div className="book-field">
                      <label>Chủ đề</label>
                      <input
                        className="input-field"
                        placeholder="Bạn muốn trao đổi điều gì?"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>

                    <div className="book-field">
                      <label>Ghi chú (tuỳ chọn)</label>
                      <textarea
                        className="input-field"
                        placeholder="Câu hỏi hoặc ngữ cảnh thêm…"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="book-side">
              <div className="book-card">
                <div className="book-card-body book-profile">
                  <div className="book-profile-avatar">
                    {mentor.avatarUrl ? (
                      <img src={mentor.avatarUrl} alt="" />
                    ) : (
                      mentor.fullName.charAt(0)
                    )}
                  </div>

                  <h3 className="book-profile-name">{mentor.fullName}</h3>
                  <p className="book-profile-spec">{mentor.specialization}</p>
                </div>
              </div>

              <div className="book-card">
                <div className="book-card-body">
                  <h3 className="book-card-title">
                    <UserPlus size={18} /> Mời thêm người
                  </h3>

                  <p className="book-invite-sub">
                    Thêm email đồng đội cần tham gia cuộc họp.
                  </p>

                  <div className="book-invite-row">
                    <input
                      type="email"
                      className="input-field"
                      style={{ padding: '0.5rem 0.75rem' }}
                      placeholder="email@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                    />
                    <button
                      type="button"
                      onClick={addEmail}
                      className="book-add-btn"
                      style={{ padding: '0.5rem', minWidth: 'auto' }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="book-emails">
                    {participantEmails.map((email) => (
                      <div key={email} className="book-email-chip">
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="book-email-remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="book-submit-btn"
                disabled={submitting || !selectedSlot}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <CheckCircle size={20} /> Xác nhận đặt lịch
                  </>
                )}
              </button>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookMentorPage;