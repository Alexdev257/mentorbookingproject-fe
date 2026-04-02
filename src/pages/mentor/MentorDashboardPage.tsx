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
} from "lucide-react";

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

  // Poll to make sure pending/confirmed updates show without manual refresh.
  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          await loadDashboard();
        } catch (e) {
          // Keep UI stable; just skip this round.
          console.error("Failed to refetch mentor dashboard:", e);
        }
      })();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [user, loadDashboard]);

  useEffect(() => {
    // Need mentee names for both "pending" (accept/reject) and "confirmed" (cancel).
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

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  const availableSlots = slots.filter((x) => !x.isBooked).length;
  const pendingRequests = bookings.filter((b) => b.status === BookingStatus.Pending).length;
  const acceptedSessions = bookings.filter((b) => b.status === BookingStatus.Confirmed).length;
  const pendingBookingsPreview = bookings.filter((b) => b.status === BookingStatus.Pending).slice(0, 5);
  const confirmedBookingsPreview = bookings.filter((b) => b.status === BookingStatus.Confirmed).slice(0, 5);

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

  return (
    <div className="admin-page" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* HERO */}
      <div
        className="glass-card"
        style={{
          padding: "1.8rem",
          background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)",
          border: "1px solid #e5e7eb",
        }}
      >
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Xin chào, {first} 👋</h1>

        <p style={{ color: "var(--text-secondary)", marginTop: 6 }}>
          Quản lý lịch mentoring của bạn một cách trực quan.
        </p>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <span className="admin-chip">🟢 {availableSlots} slot trống</span>
          <span className="admin-chip">🟡 {pendingRequests} chờ duyệt</span>
          <span className="admin-chip">🔵 {acceptedSessions} đã xác nhận</span>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        {[
          {
            label: "Khung trống",
            value: availableSlots,
            icon: <Calendar size={20} />,
            color: "#22c55e",
          },
          {
            label: "Chờ duyệt",
            value: pendingRequests,
            icon: <Inbox size={20} />,
            color: "#f59e0b",
          },
          {
            label: "Đã xác nhận",
            value: acceptedSessions,
            icon: <CheckCircle2 size={20} />,
            color: "#3b82f6",
          },
        ].map((item, i) => (
          <div key={i} className="glass-card" style={{ padding: "1.2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{item.value}</div>
              </div>
              <div style={{ color: item.color }}>{item.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* PENDING */}
      {pendingBookingsPreview.length > 0 && (
        <div className="glass-card" style={{ padding: "1.2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <strong>Yêu cầu chờ duyệt</strong>
            <Link to="/mentor/bookings">Xem tất cả</Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pendingBookingsPreview.map((b) => (
              <div
                key={b.id}
                style={{
                  padding: "0.9rem",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{menteeNames[b.menteeId] ?? "..."}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {new Date(b.scheduleStart).toLocaleString("vi-VN")}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn-primary"
                    onClick={() => handleAcceptReject(b.id, "accept")}
                    disabled={processingId === b.id}
                  >
                    {processingId === b.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  </button>

                  <button className="admin-btn-secondary" onClick={() => handleAcceptReject(b.id, "reject")}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONFIRMED */}
      {confirmedBookingsPreview.length > 0 && (
        <div className="glass-card" style={{ padding: "1.2rem" }}>
          <strong>Đã xác nhận</strong>

          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {confirmedBookingsPreview.map((b) => (
              <div
                key={b.id}
                style={{
                  padding: "0.9rem",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{menteeNames[b.menteeId] ?? "..."}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {new Date(b.scheduleStart).toLocaleString("vi-VN")}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  {b.meetingLink && (
                    <a href={b.meetingLink} target="_blank" className="btn-primary">
                      <LinkIcon size={14} />
                    </a>
                  )}

                  <button className="admin-btn-secondary" onClick={() => handleCancelAccepted(b.id)}>
                    <Ban size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NAVIGATION */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "1rem" }}>
        {[
          {
            to: "/mentor/slots",
            title: "Lịch trống",
            icon: <Calendar size={20} />,
          },
          {
            to: "/mentor/bookings",
            title: "Duyệt booking",
            icon: <Inbox size={20} />,
          },
          {
            to: "/mentor/reviews",
            title: "Đánh giá",
            icon: <Star size={20} />,
          },
        ].map((item, i) => (
          <Link key={i} to={item.to} style={{ textDecoration: "none" }}>
            <div
              className="glass-card"
              style={{
                padding: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {item.icon}
                <span>{item.title}</span>
              </div>
              <ChevronRight size={16} />
            </div>
          </Link>
        ))}
      </div>

      {/* FOOTER NOTE */}
      <div className="glass-card" style={{ padding: "1rem", fontSize: 13 }}>
        ⏱ Hãy phản hồi booking trong 24–48h để giữ trải nghiệm tốt.
      </div>
    </div>
  );
};

export default MentorDashboardPage;
