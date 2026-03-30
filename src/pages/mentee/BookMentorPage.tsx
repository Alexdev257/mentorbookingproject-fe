import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingApi } from '../../api/booking';
import { mentorsApi } from '../../api/services';
import type { TeacherResponseDto, SlotResponseDto } from '../../types';
import { Calendar, UserPlus, Info, CheckCircle, Loader2, Plus, X } from 'lucide-react';
import { MonthCalendar } from '../../components/calendar/MonthCalendar';
import type { MonthCalMarker } from '../../components/calendar/MonthCalendar';
import { isDateInMonthGrid, isSameLocalDay, startOfMonth, toLocalYmd, visibleGridUtcRange } from '../../components/calendar/monthUtils';

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
    const earliest = slots.reduce((min, s) => {
      const t = new Date(s.startAt).getTime();
      return t < min.t ? { t, s } : min;
    }, { t: Infinity as number, s: slots[0] });
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
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  if (!mentor) return <div>Không tìm thấy mentor.</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1>Đặt lịch</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Xem lịch theo tháng: ngày có chấm xanh là còn slot trống. Chọn ngày rồi chọn giờ cụ thể.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="var(--brand-primary)" /> 1. Chọn ngày &amp; giờ với {mentor.fullName}
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
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem', lineHeight: 1.45 }}>
              Chấm xanh: còn slot trống. Đổi tháng để tải thêm lịch trống (theo khung hiển thị).
            </p>

            {slotsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', color: 'var(--text-secondary)' }}>
                <Loader2 className="animate-spin" size={18} /> Đang tải slot…
              </div>
            ) : slots.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', marginTop: '1.25rem' }}>Không có slot trống trong khung tháng này. Thử chuyển sang tháng khác.</p>
            ) : !selectedDay ? (
              <p style={{ color: 'var(--text-secondary)', marginTop: '1.25rem' }}>Bấm một ngày có chấm xanh để xem giờ cụ thể.</p>
            ) : slotsOnSelectedDay.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', marginTop: '1.25rem' }}>
                Không còn slot trống vào {selectedDay.toLocaleDateString('vi-VN')}. Chọn ngày khác.
              </p>
            ) : (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                  Giờ trống — {selectedDay.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                  {slotsOnSelectedDay.map((slot) => {
                    const start = new Date(slot.startAt);
                    const end = new Date(slot.endAt);
                    const label = `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                    const active = selectedSlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot.id)}
                        style={{
                          padding: '0.65rem 0.9rem',
                          borderRadius: 'var(--radius-sm, 8px)',
                          border: active ? '2px solid var(--brand-primary)' : '1px solid var(--glass-border)',
                          background: active ? 'rgba(88, 166, 255, 0.12)' : 'rgba(255,255,255,0.04)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontWeight: active ? 700 : 500,
                          fontSize: '0.875rem',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={20} color="var(--brand-primary)" /> 2. Nội dung buổi
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Chủ đề</label>
                <input
                  className="input-field"
                  placeholder="Bạn muốn trao đổi điều gì?"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Ghi chú (tuỳ chọn)</label>
                <textarea
                  className="input-field"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Câu hỏi hoặc ngữ cảnh thêm…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {mentor.avatarUrl ? (
                <img src={mentor.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                mentor.fullName.charAt(0)
              )}
            </div>
            <h3 style={{ marginBottom: '0.25rem' }}>{mentor.fullName}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{mentor.specialization}</p>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} color="var(--brand-primary)" /> Mời thêm người
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Thêm email đồng đội cần tham gia cuộc họp.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="email"
                className="input-field"
                style={{ padding: '0.5rem 0.75rem' }}
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
              />
              <button type="button" onClick={addEmail} className="btn-primary" style={{ padding: '0.5rem', minWidth: 'auto' }}>
                <Plus size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {participantEmails.map((email) => (
                <div
                  key={email}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifySelf: 'space-between',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</span>
                  <button type="button" onClick={() => removeEmail(email)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary"
            style={{ width: '100%', padding: '1rem', justifyContent: 'center' }}
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
  );
};

export default BookMentorPage;
