import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../api/booking';
import type { SlotResponseDto } from '../../types';
import { Calendar, Plus, Trash2, Loader2 } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { MonthCalendar } from '../../components/calendar/MonthCalendar';
import type { MonthCalMarker } from '../../components/calendar/MonthCalendar';
import { isSameLocalDay, startOfMonth, toLocalYmd } from '../../components/calendar/monthUtils';

const SlotsPage: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<SlotResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({ startTime: '', endTime: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });

  const fetchSlots = async () => {
    if (!user) return;
    try {
      const response = await bookingApi.getMentorSlots(user.id, { includeBooked: true });
      if (response.isSuccess) {
        setSlots(response.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void fetchSlots();
  }, [user]);

  const markersByDay = useMemo(() => {
    const map: Record<string, MonthCalMarker[]> = {};
    for (const s of slots) {
      const key = toLocalYmd(new Date(s.startAt));
      if (!map[key]) map[key] = [];
      map[key].push({
        color: s.isBooked ? 'var(--warning, #dbab09)' : 'var(--success, #3fb950)',
        title: s.isBooked ? 'Đã đặt' : 'Còn trống',
      });
    }
    return map;
  }, [slots]);

  const slotsOnSelectedDay = useMemo(() => {
    return slots
      .filter((s) => isSameLocalDay(s.startAt, selectedDate))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [slots, selectedDate]);

  const selectedYmd = toLocalYmd(selectedDate);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);
    setFormSuccess(null);
    setIsAdding(true);
    try {
      const startAt = `${selectedYmd}T${newSlot.startTime}:00Z`;
      const endAt = `${selectedYmd}T${newSlot.endTime}:00Z`;
      const response = await bookingApi.createSlot(user.id, { startAt, endAt });
      if (response.isSuccess) {
        await fetchSlots();
        setNewSlot({ startTime: '', endTime: '' });
        setFormSuccess('Đã thêm khung giờ.');
        window.setTimeout(() => setFormSuccess(null), 3500);
      } else {
        const detail = response.listErrors?.map((x) => x.detail).filter(Boolean).join(' · ');
        setFormError(detail || response.message || 'Không tạo được slot');
      }
    } catch {
      setFormError('Lỗi mạng hoặc máy chủ');
    } finally {
      setIsAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!user || !deleteId) return;
    setDeleteLoading(true);
    try {
      const response = await bookingApi.deleteSlot(user.id, deleteId);
      if (response.isSuccess) {
        setSlots((prev) => prev.filter((s) => s.id !== deleteId));
        setDeleteId(null);
      }
    } catch (err) {
      console.error('Failed to delete slot:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const slotPendingDelete = slots.find((s) => s.id === deleteId);

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Mentor"
        title="Lịch trống"
        description="Bấm vào một ngày trên lịch để chọn ngày, rồi nhập giờ bắt đầu / kết thúc và thêm slot. Slot đã có người đặt không thể xóa."
      />

      <AdminConfirmDialog
        open={!!deleteId}
        title="Xóa khung giờ?"
        message={
          slotPendingDelete
            ? `Xóa ${new Date(slotPendingDelete.startAt).toLocaleString('vi-VN')} — ${new Date(slotPendingDelete.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}?`
            : ''
        }
        confirmLabel="Xóa"
        loading={deleteLoading}
        onCancel={() => !deleteLoading && setDeleteId(null)}
        onConfirm={confirmDelete}
      />

      <div className="mentor-layout-grid" style={{ alignItems: 'start' }}>
        <div className="admin-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="admin-toolbar" style={{ background: 'linear-gradient(90deg, rgba(88, 166, 255, 0.08) 0%, transparent 50%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--brand-primary)" />
              <span style={{ fontWeight: 700 }}>Lịch slot</span>
            </div>
            <span className="admin-chip">{loading ? '…' : `${slots.length} slot`}</span>
          </div>
          <div style={{ padding: '1rem' }}>
            <MonthCalendar
              visibleMonth={visibleMonth}
              onVisibleMonthChange={(d) => setVisibleMonth(startOfMonth(d))}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                const x = new Date(d);
                x.setHours(0, 0, 0, 0);
                setSelectedDate(x);
                setVisibleMonth(startOfMonth(x));
              }}
              markersByDay={markersByDay}
            />
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.45 }}>
              <strong>Chấm xanh</strong>: slot còn trống · <strong>Chấm vàng</strong>: đã có mentee đặt. Bấm ngày để thêm slot cho ngày đó.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>
              Slot trong ngày đã chọn
            </div>
            {loading ? (
              <div className="admin-skeleton" aria-busy="true">
                <div className="admin-skeleton-bar" />
              </div>
            ) : slotsOnSelectedDay.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Chưa có slot nào trong ngày này.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 240, overflowY: 'auto' }}>
                {slotsOnSelectedDay.map((slot) => (
                  <div
                    key={slot.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--glass-border)',
                      background: 'rgba(0,0,0,0.18)',
                    }}
                  >
                    <div style={{ fontSize: '0.875rem', fontWeight: 650 }}>
                      {new Date(slot.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} —{' '}
                      {new Date(slot.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      <span className={`status-badge ${slot.isBooked ? 'status-pending' : 'status-active'}`} style={{ marginLeft: '0.5rem' }}>
                        {slot.isBooked ? 'Đã đặt' : 'Trống'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="admin-icon-btn"
                      title={slot.isBooked ? 'Không thể xóa slot đã đặt' : 'Xóa slot'}
                      disabled={slot.isBooked}
                      onClick={() => setDeleteId(slot.id)}
                      style={slot.isBooked ? { opacity: 0.4, cursor: 'not-allowed' } : { color: 'var(--error)' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="admin-panel" style={{ padding: '1.35rem 1.5rem', position: 'sticky', top: '1rem' }}>
          <h3 style={{ marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
            <Plus size={22} color="var(--brand-primary)" /> Thêm khung giờ
          </h3>
          <div
            style={{
              marginBottom: '1.1rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border)',
              background: 'rgba(88, 166, 255, 0.08)',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ngày đã chọn</div>
            <div style={{ fontWeight: 750, marginTop: '0.25rem' }}>
              {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
            </div>
          </div>
          {formSuccess ? (
            <div style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(63,185,80,0.12)', color: 'var(--success)', fontSize: '0.875rem' }}>
              {formSuccess}
            </div>
          ) : null}
          {formError ? <div className="admin-alert-error" style={{ marginBottom: '1rem' }}>{formError}</div> : null}
          <form onSubmit={handleAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label className="admin-label" htmlFor="slot-start">
                  Bắt đầu
                </label>
                <input
                  id="slot-start"
                  type="time"
                  className="input-field"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="admin-label" htmlFor="slot-end">
                  Kết thúc
                </label>
                <input
                  id="slot-end"
                  type="time"
                  className="input-field"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <button type="submit" className="admin-btn-primary" style={{ justifyContent: 'center', width: '100%', marginTop: '0.25rem' }} disabled={isAdding}>
              {isAdding ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Plus size={18} /> Thêm lịch
                </>
              )}
            </button>
          </form>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', lineHeight: 1.45 }}>
            Giờ nhập theo máy của bạn; hệ thống gửi lên API dạng ISO như trước ({selectedYmd} + giờ).
          </p>
        </div>
      </div>
    </div>
  );
};

export default SlotsPage;
