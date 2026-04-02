import React, { useState, useEffect, useMemo } from "react";
import { bookingApi } from "../../api/booking";
import { meetingApi } from "../../api/meetings";
import { userApi } from "../../api/services";
import { useAuth } from "../../contexts/AuthContext";
import type { BookingResponseDto, MeetingRecordingDto } from "../../types";
import { Check, X, Link as LinkIcon, Loader2, Inbox, Ban } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { BookingStatus } from "../../constants/bookingStatus";
import { MonthCalendar } from "../../components/calendar/MonthCalendar";
import type { MonthCalMarker } from "../../components/calendar/MonthCalendar";
import { isSameLocalDay, startOfMonth, toLocalYmd } from "../../components/calendar/monthUtils";

const statusLabel = (s: number) => {
  if (s === BookingStatus.Pending) return "Chờ duyệt";
  if (s === BookingStatus.Confirmed) return "Đã xác nhận";
  if (s === BookingStatus.Rejected) return "Từ chối";
  if (s === BookingStatus.Cancelled) return "Đã hủy";
  if (s === BookingStatus.Completed) return "Hoàn thành";
  return "Khác";
};

const statusBadgeClass = (s: number) => {
  if (s === BookingStatus.Pending) return "status-pending";
  if (s === BookingStatus.Confirmed || s === BookingStatus.Completed) return "status-active";
  return "status-inactive";
};

function bookingMarker(status: number): { color: string; title: string } {
  switch (status) {
    case BookingStatus.Pending:
      return { color: "var(--warning, #dbab09)", title: "Chờ duyệt" };
    case BookingStatus.Confirmed:
    case BookingStatus.Completed:
      return {
        color: "var(--success, #3fb950)",
        title: status === BookingStatus.Completed ? "Hoàn thành" : "Đã xác nhận",
      };
    case BookingStatus.Rejected:
    case BookingStatus.Cancelled:
      return { color: "var(--text-muted, #8b949e)", title: status === BookingStatus.Rejected ? "Từ chối" : "Đã hủy" };
    default:
      return { color: "#888", title: "Khác" };
  }
}

const BookingRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [menteeNames, setMenteeNames] = useState<Record<string, string>>({});
  const [meetingByBooking, setMeetingByBooking] = useState<
    Record<string, { joinUrl?: string; recordings: MeetingRecordingDto[] }>
  >({});
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedFilterDate, setSelectedFilterDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Số lượng dòng trên mỗi trang (bạn có thể đổi thành 5, 10 tùy ý)

  // THÊM: Reset về trang 1 khi đổi ngày lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilterDate]);
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
      console.error("Failed to fetch bookings:", err);
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
      console.error("Failed to refetch bookings:", err);
    }
  };

  const displayedBookings = useMemo(() => {
    if (!selectedFilterDate) return bookings;
    return bookings.filter((b) => isSameLocalDay(b.scheduleStart, selectedFilterDate));
  }, [bookings, selectedFilterDate]);

  // THÊM: Tính toán dữ liệu cho trang hiện tại
  const totalItems = displayedBookings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedBookings = displayedBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          return [id, "Sinh viên"] as const;
        }),
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
            const recordings = recordingsRes.isSuccess ? (recordingsRes.data ?? []) : [];
            return [bookingId, { joinUrl, recordings }] as const;
          } catch {
            return [bookingId, { joinUrl: undefined, recordings: [] }] as const;
          }
        }),
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

  const handleAction = async (id: string, action: "accept" | "reject") => {
    setProcessingId(id);
    try {
      const response = action === "accept" ? await bookingApi.acceptBooking(id) : await bookingApi.rejectBooking(id);
      if (response.isSuccess) {
        await fetchBookings();
      } else {
        window.alert(response.message || (action === "accept" ? "Chấp nhận thất bại" : "Từ chối thất bại"));
      }
    } catch (err) {
      console.error(`Failed to ${action} booking:`, err);
      window.alert("Lỗi mạng hoặc máy chủ.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelAccepted = async (id: string) => {
    if (!window.confirm("Hủy buổi đã xác nhận? Slot sẽ được mở lại cho sinh viên khác.")) return;
    setProcessingId(id);
    try {
      const response = await bookingApi.cancelBooking(id);
      if (response.isSuccess) {
        await fetchBookings();
      } else {
        window.alert(response.message || "Hủy lịch thất bại");
      }
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      window.alert("Lỗi mạng hoặc máy chủ.");
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
        description="Quản lý và duyệt lịch hẹn. Chấp nhận/Từ chối yêu cầu, truy cập phòng họp hoặc hủy lịch khi có thay đổi kế hoạch."
        actions={
          <span className="admin-chip" style={{ background: "#fef3c7", color: "#0000FF", border: "1px solid #fde68a" }}>
            {loading ? "…" : `${pendingCount} chờ xử lý`}
          </span>
        }
      />

      <div className="bookings-dashboard-layout">
        {/* ================= CỘT TRÁI: BỘ LỌC LỊCH (Đã ép màu trắng) ================= */}
        <div>
          <div
            className="admin-panel"
            style={{
              padding: "1.5rem",
              position: "sticky",
              top: "1.5rem",
              backgroundColor: "#ffffff" /* Ép màu nền trắng */,
              color: "#334155" /* Ép màu chữ tối */,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Lịch & Bộ lọc</div>
              {selectedFilterDate && (
                <button
                  type="button"
                  className="admin-btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
                  onClick={() => setSelectedFilterDate(null)}
                >
                  Xóa lọc
                </button>
              )}
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

            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1.25rem",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                fontSize: "0.8125rem",
                color: "#64748b",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dbab09" }}></span> Chờ duyệt
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3fb950" }}></span> Đã xác nhận /
                Hoàn thành
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b949e" }}></span> Đã hủy / Từ
                chối
              </div>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI: BẢNG DANH SÁCH & PHÂN TRANG ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#334155" }}>
              {selectedFilterDate
                ? `Lịch hẹn ngày ${selectedFilterDate.toLocaleDateString("vi-VN")}`
                : "Tất cả lịch hẹn"}
            </h3>
            <span style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 500 }}>Tổng: {totalItems} kết quả</span>
          </div>

          <div
            className="admin-panel"
            style={{ padding: 0, overflow: "hidden", background: "#fff", border: "1px solid #e2e8f0" }}
          >
            <div className="admin-table-scroll" style={{ overflowX: "auto" }}>
              <table className="admin-table" style={{ width: "100%", minWidth: "700px" }}>
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    <th>Sinh viên</th>
                    <th>Thời gian</th>
                    <th>Nội dung</th>
                    <th>Trạng thái</th>
                    <th style={{ minWidth: 140 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "2rem" }}>
                        <div className="admin-skeleton" style={{ height: "40px", marginBottom: "10px" }} />
                        <div className="admin-skeleton" style={{ height: "40px", marginBottom: "10px" }} />
                        <div className="admin-skeleton" style={{ height: "40px" }} />
                      </td>
                    </tr>
                  ) : totalItems === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="admin-empty" style={{ padding: "3rem 0" }}>
                          <div className="admin-empty-icon">
                            <Inbox size={28} />
                          </div>
                          <p style={{ fontWeight: 600 }}>Chưa có yêu cầu</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedBookings.map((booking) => (
                      <tr key={booking.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td>
                          <div style={{ fontWeight: 650, color: "#1e293b" }}>
                            {menteeNames[booking.menteeId] ?? "…"}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                            ID: {booking.menteeId.substring(0, 8)}...
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                            {new Date(booking.scheduleStart).toLocaleDateString("vi-VN")}
                          </div>
                          <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                            {new Date(booking.scheduleStart).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(booking.scheduleEnd).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{booking.topic || "—"}</div>
                          {booking.priceAmount > 0 && (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "#0f172a",
                                background: "#f1f5f9",
                                padding: "0.1rem 0.4rem",
                                borderRadius: "4px",
                                display: "inline-block",
                                marginTop: "0.25rem",
                              }}
                            >
                              {booking.priceAmount.toLocaleString("vi-VN")} {booking.currency}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${statusBadgeClass(booking.status)}`}>
                            {statusLabel(booking.status)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                            {booking.status === BookingStatus.Pending && (
                              <>
                                <button
                                  className="admin-btn-primary"
                                  style={{
                                    padding: "0.35rem 0.6rem",
                                    fontSize: "0.75rem",
                                    background: "#10b981",
                                    border: "none",
                                  }}
                                  onClick={() => handleAction(booking.id, "accept")}
                                  disabled={processingId === booking.id}
                                >
                                  {processingId === booking.id ? (
                                    <Loader2 className="animate-spin" size={14} />
                                  ) : (
                                    <Check size={14} />
                                  )}{" "}
                                  Duyệt
                                </button>
                                <button
                                  className="admin-btn-secondary"
                                  style={{
                                    padding: "0.35rem 0.6rem",
                                    fontSize: "0.75rem",
                                    color: "#ef4444",
                                    borderColor: "#fca5a5",
                                  }}
                                  onClick={() => handleAction(booking.id, "reject")}
                                  disabled={processingId === booking.id}
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}

                            {booking.status === BookingStatus.Confirmed && (
                              <>
                                {(booking.meetingLink || meetingByBooking[booking.id]?.joinUrl) && (
                                  <a
                                    href={booking.meetingLink || meetingByBooking[booking.id]?.joinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-btn-primary"
                                    style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem" }}
                                  >
                                    <LinkIcon size={14} /> Vào họp
                                  </a>
                                )}
                                <button
                                  className="admin-btn-secondary"
                                  style={{
                                    padding: "0.35rem 0.6rem",
                                    fontSize: "0.75rem",
                                    color: "#d97706",
                                    borderColor: "#fde047",
                                  }}
                                  onClick={() => void handleCancelAccepted(booking.id)}
                                  disabled={processingId === booking.id}
                                >
                                  {processingId === booking.id ? (
                                    <Loader2 className="animate-spin" size={14} />
                                  ) : (
                                    <Ban size={14} />
                                  )}{" "}
                                  Hủy
                                </button>
                              </>
                            )}

                            {booking.status === BookingStatus.Completed &&
                              meetingByBooking[booking.id]?.recordings?.[0]?.storageUrl && (
                                <a
                                  href={meetingByBooking[booking.id].recordings[0].storageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="admin-btn-secondary"
                                  style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem" }}
                                >
                                  <LinkIcon size={14} /> Xem Record
                                </a>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  borderTop: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)}{" "}
                  trong số {totalItems}
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="admin-btn-secondary"
                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </button>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "0 0.5rem",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      color: "#334155",
                    }}
                  >
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    className="admin-btn-secondary"
                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingRequestsPage;
