import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { bookingApi } from "../../api/booking";
import type { SlotResponseDto } from "../../types";
import { Calendar, Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminConfirmDialog } from "../../components/admin/AdminConfirmDialog";
import { MonthCalendar } from "../../components/calendar/MonthCalendar";
import type { MonthCalMarker } from "../../components/calendar/MonthCalendar";
import { isSameLocalDay, startOfMonth, toLocalYmd } from "../../components/calendar/monthUtils";
import { vietnamWallToUtcIso } from "../../utils/vietnamTime";
import "./MentorDashboard.css"; // Nhớ import file CSS

const SlotsPage: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<SlotResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({ startTime: "", endTime: "" });
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
      console.error("Failed to fetch slots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void fetchSlots();
  }, [user]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showAllSlots, setShowAllSlots] = useState(false);

  // THÊM EFFECT NÀY: Reset trạng thái "Xem thêm" khi đổi ngày
  useEffect(() => {
    setShowAllSlots(false);
  }, [selectedDate]);

  const markersByDay = useMemo(() => {
    const map: Record<string, MonthCalMarker[]> = {};
    for (const s of slots) {
      const key = toLocalYmd(new Date(s.startAt));
      if (!map[key]) map[key] = [];
      map[key].push({
        color: s.isBooked ? "#f59e0b" : "#10b981", // Amber cho đã đặt, Emerald cho trống
        title: s.isBooked ? "Đã đặt" : "Còn trống",
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
      const startAt = vietnamWallToUtcIso(selectedYmd, newSlot.startTime);
      const endAt = vietnamWallToUtcIso(selectedYmd, newSlot.endTime);
      const response = await bookingApi.createSlot(user.id, { startAt, endAt });
      if (response.isSuccess) {
        await fetchSlots();
        setNewSlot({ startTime: "", endTime: "" });
        setFormSuccess("Đã thêm khung giờ thành công.");
        window.setTimeout(() => setFormSuccess(null), 3500);
      } else {
        const detail = response.listErrors
          ?.map((x) => x.detail)
          .filter(Boolean)
          .join(" · ");
        setFormError(detail || response.message || "Không tạo được slot");
      }
    } catch {
      setFormError("Lỗi mạng hoặc máy chủ");
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
      console.error("Failed to delete slot:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const slotPendingDelete = slots.find((s) => s.id === deleteId);

  return (
    <div className="admin-page animate-fade-in" style={{ color: "#0f172a" }}>
      <AdminPageHeader
        eyebrow="Mentor"
        title="Lịch trống"
        description="Chọn ngày trên lịch, nhập giờ theo Việt Nam (GMT+7); hệ thống gửi lên máy chủ dạng UTC. Slot đã có người đặt không thể xóa."
      />

      <AdminConfirmDialog
        open={!!deleteId}
        title="Xóa khung giờ?"
        message={
          slotPendingDelete
            ? `Bạn có chắc chắn muốn xóa slot từ ${new Date(slotPendingDelete.startAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} đến ${new Date(slotPendingDelete.endAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${new Date(slotPendingDelete.startAt).toLocaleDateString("vi-VN")}?`
            : ""
        }
        confirmLabel="Xóa"
        loading={deleteLoading}
        onCancel={() => !deleteLoading && setDeleteId(null)}
        onConfirm={confirmDelete}
      />

      {/* THAY THẾ LAYOUT BẮT ĐẦU TỪ ĐÂY */}
      <div className="slots-dashboard-layout">
        {/* === CỘT TRÁI: CHỈ CÒN DUY NHẤT LỊCH === */}
        <div className="slots-col">
          <div
            className="slot-panel"
            style={{ overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}
          >
            <div
              style={{
                padding: "1.25rem",
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b" }}>
                <Calendar size={20} color="#2563eb" />
                <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Lịch slot</span>
              </div>
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#64748b",
                  fontWeight: 500,
                  background: "#e2e8f0",
                  padding: "0.2rem 0.75rem",
                  borderRadius: "999px",
                }}
              >
                {loading ? "Đang tải..." : `${slots.length} slot`}
              </span>
            </div>

            <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
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
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  fontSize: "0.8125rem",
                  color: "#64748b",
                  marginTop: "auto",
                  paddingTop: "1.5rem",
                  justifyContent: "center",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }}></span> Còn trống
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }}></span> Đã đặt
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* === CỘT PHẢI: LIST SLOTS (TRÊN) & FORM THÊM (DƯỚI) === */}
        <div className="slots-col">
          {/* CỤC 1: LIST SLOTS TRONG NGÀY DẠNG Ô VUÔNG */}
          <div
            className="slot-panel"
            style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "1.2rem",
                flexShrink: 0,
              }}
            >
              Slot ngày {selectedDate.toLocaleDateString("vi-VN")}
            </div>

            {loading ? (
              <div
                className="animate-pulse-fast"
                style={{ height: "40px", background: "#e2e8f0", borderRadius: "0.5rem" }}
              />
            ) : slotsOnSelectedDay.length === 0 ? (
              <div style={{ fontSize: "0.875rem", color: "#94a3b8", textAlign: "center", padding: "1rem 0" }}>
                Chưa có slot nào trong ngày này.
              </div>
            ) : (
              <div style={{ overflowY: "auto", paddingRight: "4px", flex: 1, minHeight: 0 }}>
                <div className="slots-grid-container">
                  {/* Hiển thị 12 slot đầu tiên, thu gọn cực kỳ tiết kiệm diện tích */}
                  {(showAllSlots ? slotsOnSelectedDay : slotsOnSelectedDay.slice(0, 12)).map((slot, index) => (
                    <div key={slot.id} className="slot-tile" style={{ animationDelay: `${index * 0.03}s` }}>
                      {/* Giờ hiển thị trên 1 dòng duy nhất */}
                      <div className="slot-tile-time">
                        {new Date(slot.startAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(slot.endAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </div>

                      {/* Badge trạng thái */}
                      <span className={`slot-tile-status ${slot.isBooked ? "pending" : "active"}`}>
                        {slot.isBooked ? "Đã đặt" : "Trống"}
                      </span>

                      {/* Nút xóa (chỉ hiện khi hover và slot trống) */}
                      <button
                        type="button"
                        className="slot-tile-delete"
                        title={slot.isBooked ? "Không thể xóa slot đã đặt" : "Xóa slot"}
                        disabled={slot.isBooked}
                        onClick={() => setDeleteId(slot.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Cập nhật lại điều kiện nút xem thêm */}
                {slotsOnSelectedDay.length > 12 && (
                  <button className="btn-show-more" onClick={() => setShowAllSlots(!showAllSlots)}>
                    {showAllSlots ? "Thu gọn danh sách" : `Xem thêm ${slotsOnSelectedDay.length - 12} khung giờ`}
                  </button>
                )}
              </div>
            )}
          </div>
          {/* CỤC 2: FORM THÊM KHUNG GIỜ */}
          <div className="slot-panel" style={{ padding: "1.5rem", flexShrink: 0 }}>
            <h3
              style={{
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1.2rem",
                color: "#1e293b",
              }}
            >
              <Plus size={22} color="#2563eb" /> Thêm khung giờ
            </h3>

            <div
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                borderRadius: "0.5rem",
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#3b82f6", textTransform: "uppercase" }}>
                Đang chọn ngày
              </div>
              <div style={{ fontWeight: 700, marginTop: "0.25rem", color: "#1e3a8a", fontSize: "1.05rem" }}>
                {selectedDate.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "numeric",
                  month: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>

            {formSuccess && (
              <div
                className="animate-slide-down"
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                <CheckCircle2 size={18} /> {formSuccess}
              </div>
            )}

            {formError && (
              <div
                className="animate-slide-down"
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                <AlertCircle size={18} /> {formError}
              </div>
            )}

            <form onSubmit={handleAddSlot} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "0.5rem",
                    }}
                    htmlFor="slot-start"
                  >
                    Giờ bắt đầu (GMT+7)
                  </label>
                  <input
                    id="slot-start"
                    type="time"
                    className="time-input"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "0.5rem",
                    }}
                    htmlFor="slot-end"
                  >
                    Giờ kết thúc (GMT+7)
                  </label>
                  <input
                    id="slot-end"
                    type="time"
                    className="time-input"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-add-slot" disabled={isAdding}>
                {isAdding ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Plus size={18} /> Tạo lịch trống
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotsPage;
