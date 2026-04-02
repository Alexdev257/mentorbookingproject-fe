import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { bookingApi } from "../../api/booking";
import { userApi } from "../../api/services";
import type { SlotResponseDto, BookingResponseDto } from "../../types";
import { BookingStatus } from "../../constants/bookingStatus";
import {
  Calendar,
  Inbox,
  ChevronRight,
  Check,
  X,
  Loader2,
  Link as LinkIcon,
  Ban,
  Star,
  CheckCircle2,
  Clock,
} from "lucide-react";
import "./MentorDashboard.css"; // Nhớ import file CSS

const MentorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const first = user?.fullName?.split(/\s+/)[0] ?? "Mentor";
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

  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          await loadDashboard();
        } catch (e) {
          console.error("Failed to refetch mentor dashboard:", e);
        }
      })();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [user, loadDashboard]);

  useEffect(() => {
    const target = bookings.filter((b) => b.status === BookingStatus.Pending || b.status === BookingStatus.Confirmed);
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
          return [id, "Sinh viên"] as const;
        }),
      );
      if (alive) setMenteeNames(Object.fromEntries(entries));
    })();
    return () => {
      alive = false;
    };
  }, [bookings]);

  const handleAcceptReject = async (id: string, action: "accept" | "reject") => {
    setProcessingId(id);
    try {
      const res = action === "accept" ? await bookingApi.acceptBooking(id) : await bookingApi.rejectBooking(id);
      if (res.isSuccess) {
        await loadDashboard();
      } else {
        window.alert(res.message || (action === "accept" ? "Chấp nhận thất bại" : "Từ chối thất bại"));
      }
    } catch {
      window.alert("Lỗi mạng hoặc máy chủ.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelAccepted = async (id: string) => {
    if (!window.confirm("Hủy buổi đã xác nhận? Slot sẽ được mở lại cho sinh viên khác.")) return;
    setProcessingId(id);
    try {
      const res = await bookingApi.cancelBooking(id);
      if (res.isSuccess) {
        await loadDashboard();
      } else {
        window.alert(res.message || "Hủy lịch thất bại");
      }
    } catch {
      window.alert("Lỗi mạng hoặc máy chủ.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <Loader2 className="animate-spin" size={32} color="#94a3b8" />
      </div>
    );
  }

  const availableSlots = slots.filter((x) => !x.isBooked).length;
  const pendingRequests = bookings.filter((b) => b.status === BookingStatus.Pending).length;
  const acceptedSessions = bookings.filter((b) => b.status === BookingStatus.Confirmed).length;
  const pendingBookingsPreview = bookings.filter((b) => b.status === BookingStatus.Pending).slice(0, 5);
  const confirmedBookingsPreview = bookings.filter((b) => b.status === BookingStatus.Confirmed).slice(0, 5);

  return (
    <div className="mentor-dashboard">
      {/* HEADER */}
      <div className="mentor-header">
        <h1>Xin chào, {first} 👋</h1>
        <p>Quản lý lịch mentoring và tương tác với sinh viên của bạn.</p>
      </div>

      {/* STATS OVERVIEW */}
      <div className="stats-grid">
        {[
          { label: "Khung giờ trống", value: availableSlots, icon: <Calendar size={20} />, color: "#10b981" },
          { label: "Chờ duyệt", value: pendingRequests, icon: <Clock size={20} />, color: "#f59e0b" },
          { label: "Đã xác nhận", value: acceptedSessions, icon: <CheckCircle2 size={20} />, color: "#3b82f6" },
        ].map((item, i) => (
          <div key={i} className="stat-card">
            <div className="stat-header">
              <span>{item.label}</span>
              <div style={{ color: item.color }}>{item.icon}</div>
            </div>
            <div className="stat-value">{item.value}</div>
          </div>
        ))}
      </div>

      {/* BOOKINGS SECTION */}
      <div className="section-wrapper">
        {/* PENDING LIST */}
        <div className="list-section">
          <div className="section-header">
            <h2>Yêu cầu chờ duyệt</h2>
            {pendingBookingsPreview.length > 0 && (
              <Link to="/mentor/bookings" className="link-primary">
                Xem tất cả
              </Link>
            )}
          </div>

          {pendingBookingsPreview.length > 0 ? (
            <div className="list-container">
              {pendingBookingsPreview.map((b) => (
                <div key={b.id} className="list-item">
                  <div className="list-item-info">
                    <span className="font-semibold">{menteeNames[b.menteeId] ?? "Sinh viên"}</span>
                    <span className="text-muted">
                      {new Date(b.scheduleStart).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="list-item-actions">
                    <button
                      className="btn-icon btn-accept"
                      onClick={() => handleAcceptReject(b.id, "accept")}
                      disabled={processingId === b.id}
                      title="Chấp nhận"
                    >
                      {processingId === b.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button
                      className="btn-icon btn-reject"
                      onClick={() => handleAcceptReject(b.id, "reject")}
                      disabled={processingId === b.id}
                      title="Từ chối"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="list-container" style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
              Không có yêu cầu nào đang chờ
            </div>
          )}
        </div>

        {/* CONFIRMED LIST */}
        <div className="list-section">
          <div className="section-header">
            <h2>Lịch đã xác nhận</h2>
          </div>

          {confirmedBookingsPreview.length > 0 ? (
            <div className="list-container">
              {confirmedBookingsPreview.map((b) => (
                <div key={b.id} className="list-item">
                  <div className="list-item-info">
                    <span className="font-semibold">{menteeNames[b.menteeId] ?? "Sinh viên"}</span>
                    <span className="text-muted">
                      {new Date(b.scheduleStart).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="list-item-actions">
                    {b.meetingLink && (
                      <a
                        href={b.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-icon btn-link"
                        title="Tham gia Meeting"
                      >
                        <LinkIcon size={16} />
                      </a>
                    )}
                    <button
                      className="btn-icon btn-reject"
                      onClick={() => handleCancelAccepted(b.id)}
                      disabled={processingId === b.id}
                      title="Hủy lịch"
                    >
                      {processingId === b.id ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="list-container" style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
              Chưa có lịch hẹn nào
            </div>
          )}
        </div>
      </div>

      {/* QUICK NAVIGATION */}
      <div className="list-section">
        <div className="section-header">
          <h2>Truy cập nhanh</h2>
        </div>
        <div className="nav-grid">
          {[
            { to: "/mentor/slots", title: "Quản lý lịch trống", icon: <Calendar size={18} /> },
            { to: "/mentor/bookings", title: "Duyệt Booking", icon: <Inbox size={18} /> },
            { to: "/mentor/reviews", title: "Đánh giá của sinh viên", icon: <Star size={18} /> },
          ].map((item, i) => (
            <Link key={i} to={item.to} className="nav-card">
              <div className="nav-card-left">
                <div className="nav-icon-wrapper">{item.icon}</div>
                <span>{item.title}</span>
              </div>
              <ChevronRight size={18} color="#94a3b8" />
            </Link>
          ))}
        </div>
      </div>

      {/* FOOTER NOTE */}
      <div className="footer-note">
        <Clock size={16} />
        <span>Hãy phản hồi booking trong 24–48h để giữ trải nghiệm tốt cho sinh viên nhé.</span>
      </div>
    </div>
  );
};

export default MentorDashboardPage;
