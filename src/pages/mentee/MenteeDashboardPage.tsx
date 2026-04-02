import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../../api/booking';
import { reviewApi } from '../../api/reviews';
import { useAuth } from '../../contexts/AuthContext';
import type { BookingResponseDto } from '../../types';
import { BookingStatus } from '../../constants/bookingStatus';
import {
  ArrowRight,
  Calendar,
  Clock,
  Loader2,
  Star,
  Users,
} from 'lucide-react';

const menteeDashboardWorkspaceCss = `
.mentee-dashboard-workspace {
  --mdw-bg: #f5f6fb;
  --mdw-surface: #ffffff;
  --mdw-surface-soft: #f8f8fc;
  --mdw-border: #ececf3;
  --mdw-text: #17181c;
  --mdw-muted: #7b7f8f;
  --mdw-purple: #7b61ff;
  --mdw-purple-strong: #6a4df6;
  --mdw-purple-soft: rgba(123, 97, 255, 0.12);
  --mdw-green: #23b26d;
  --mdw-green-soft: rgba(35, 178, 109, 0.12);
  --mdw-yellow: #d7a316;
  --mdw-yellow-soft: rgba(215, 163, 22, 0.14);
  --mdw-red: #ef5b5b;
  --mdw-red-soft: rgba(239, 91, 91, 0.12);
  --mdw-shadow: 0 18px 45px rgba(28, 32, 48, 0.06);
  color: var(--mdw-text);
}

.mentee-dashboard-workspace .mdw-shell {
  background: var(--mdw-bg);
  border: 1px solid var(--mdw-border);
  border-radius: 28px;
  padding: 1.25rem;
  box-shadow: var(--mdw-shadow);
}

.mentee-dashboard-workspace .mdw-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0.25rem 1rem;
  border-bottom: 1px solid var(--mdw-border);
  margin-bottom: 1rem;
}

.mentee-dashboard-workspace .mdw-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mentee-dashboard-workspace .mdw-brand-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--mdw-purple) 0%, var(--mdw-purple-strong) 100%);
  box-shadow: 0 8px 22px rgba(123, 97, 255, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 1.05rem;
}

.mentee-dashboard-workspace .mdw-brand-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.mentee-dashboard-workspace .mdw-brand-sub {
  margin: 0.18rem 0 0;
  color: var(--mdw-muted);
  font-size: 0.9rem;
}

.mentee-dashboard-workspace .mdw-user-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.8rem;
  border-radius: 16px;
  background: var(--mdw-surface);
  border: 1px solid var(--mdw-border);
}

.mentee-dashboard-workspace .mdw-user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f1e9ff 0%, #ece8ff 100%);
  border: 1px solid rgba(123, 97, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mdw-purple);
  font-weight: 700;
  flex-shrink: 0;
}

.mentee-dashboard-workspace .mdw-user-name {
  font-size: 0.92rem;
  font-weight: 700;
  margin: 0;
}

.mentee-dashboard-workspace .mdw-user-sub {
  margin: 0.12rem 0 0;
  color: var(--mdw-muted);
  font-size: 0.8rem;
}

.mentee-dashboard-workspace .mdw-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr);
  gap: 1rem;
}

.mentee-dashboard-workspace .mdw-main-column,
.mentee-dashboard-workspace .mdw-side-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.mentee-dashboard-workspace .mdw-card {
  background: var(--mdw-surface);
  border: 1px solid var(--mdw-border);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(21, 26, 38, 0.04);
}

.mentee-dashboard-workspace .mdw-hero {
  padding: 1.4rem;
}

.mentee-dashboard-workspace .mdw-hero-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.mentee-dashboard-workspace .mdw-hero-title {
  font-size: 2rem;
  line-height: 1.1;
  margin: 0 0 0.55rem;
  letter-spacing: -0.03em;
}

.mentee-dashboard-workspace .mdw-hero-desc {
  margin: 0;
  color: var(--mdw-muted);
  font-size: 0.98rem;
  max-width: 42rem;
}

.mentee-dashboard-workspace .mdw-hero-chip {
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: var(--mdw-purple-soft);
  color: var(--mdw-purple-strong);
  font-weight: 700;
  font-size: 0.84rem;
  white-space: nowrap;
  border: 1px solid rgba(123, 97, 255, 0.18);
}

.mentee-dashboard-workspace .mdw-overview-board {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(220px, 0.85fr);
  gap: 1rem;
}

.mentee-dashboard-workspace .mdw-focus-panel {
  min-height: 320px;
  padding: 1rem;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.04)),
    linear-gradient(135deg, #ece8ff 0%, #f6f4ff 45%, #ffffff 100%);
  border: 1px solid rgba(123, 97, 255, 0.16);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
}

.mentee-dashboard-workspace .mdw-focus-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(123, 97, 255, 0.22), transparent 30%),
    radial-gradient(circle at bottom left, rgba(123, 97, 255, 0.08), transparent 28%);
  pointer-events: none;
}

.mentee-dashboard-workspace .mdw-focus-top,
.mentee-dashboard-workspace .mdw-focus-bottom {
  position: relative;
  z-index: 1;
}

.mentee-dashboard-workspace .mdw-focus-label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(123, 97, 255, 0.14);
  color: var(--mdw-purple-strong);
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 0.85rem;
}

.mentee-dashboard-workspace .mdw-focus-number {
  font-size: 5rem;
  line-height: 0.95;
  font-weight: 800;
  letter-spacing: -0.06em;
  margin: 0;
  color: #1f163f;
}

.mentee-dashboard-workspace .mdw-focus-caption {
  margin: 0.7rem 0 0;
  color: var(--mdw-muted);
  font-size: 0.95rem;
  max-width: 20rem;
}

.mentee-dashboard-workspace .mdw-wave {
  height: 56px;
  border-radius: 16px;
  background:
    linear-gradient(90deg,
      rgba(123, 97, 255, 0.10) 0%,
      rgba(123, 97, 255, 0.24) 12%,
      rgba(123, 97, 255, 0.08) 24%,
      rgba(123, 97, 255, 0.28) 36%,
      rgba(123, 97, 255, 0.10) 48%,
      rgba(123, 97, 255, 0.24) 60%,
      rgba(123, 97, 255, 0.08) 72%,
      rgba(123, 97, 255, 0.22) 84%,
      rgba(123, 97, 255, 0.08) 100%);
  border: 1px solid rgba(123, 97, 255, 0.14);
  position: relative;
  overflow: hidden;
}

.mentee-dashboard-workspace .mdw-wave::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(123, 97, 255, 0.62) 0 2px,
      transparent 2px 10px
    );
  mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
  opacity: 0.7;
}

.mentee-dashboard-workspace .mdw-mini-column {
  display: grid;
  grid-template-rows: repeat(3, 1fr);
  gap: 1rem;
}

.mentee-dashboard-workspace .mdw-mini-card {
  border-radius: 20px;
  border: 1px solid var(--mdw-border);
  background: var(--mdw-surface-soft);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 96px;
}

.mentee-dashboard-workspace .mdw-mini-card--upcoming {
  background: linear-gradient(135deg, rgba(35, 178, 109, 0.12) 0%, rgba(35, 178, 109, 0.04) 100%);
  border-color: rgba(35, 178, 109, 0.14);
}

.mentee-dashboard-workspace .mdw-mini-card--past {
  background: linear-gradient(135deg, rgba(215, 163, 22, 0.12) 0%, rgba(215, 163, 22, 0.04) 100%);
  border-color: rgba(215, 163, 22, 0.16);
}

.mentee-dashboard-workspace .mdw-mini-card--reviews {
  background: linear-gradient(135deg, rgba(123, 97, 255, 0.12) 0%, rgba(123, 97, 255, 0.04) 100%);
  border-color: rgba(123, 97, 255, 0.16);
}

.mentee-dashboard-workspace .mdw-mini-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.mentee-dashboard-workspace .mdw-mini-label {
  color: var(--mdw-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.mentee-dashboard-workspace .mdw-mini-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  margin: 0;
  color: var(--mdw-text);
}

.mentee-dashboard-workspace .mdw-mini-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: rgba(255,255,255,0.66);
  border: 1px solid rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mdw-text);
  flex-shrink: 0;
}

.mentee-dashboard-workspace .mdw-bottom-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  gap: 1rem;
}

.mentee-dashboard-workspace .mdw-panel {
  padding: 1.25rem;
}

.mentee-dashboard-workspace .mdw-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.mentee-dashboard-workspace .mdw-panel-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
}

.mentee-dashboard-workspace .mdw-panel-sub {
  margin: 0.3rem 0 0;
  color: var(--mdw-muted);
  font-size: 0.9rem;
}

.mentee-dashboard-workspace .mdw-dot-group {
  display: inline-flex;
  gap: 0.35rem;
}

.mentee-dashboard-workspace .mdw-dot-group span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #d6d8e1;
}

.mentee-dashboard-workspace .mdw-action-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.mentee-dashboard-workspace .mdw-action-link {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 136px;
  text-decoration: none;
  padding: 1rem;
  border-radius: 20px;
  border: 1px solid var(--mdw-border);
  background: var(--mdw-surface-soft);
  color: var(--mdw-text);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.mentee-dashboard-workspace .mdw-action-link:hover {
  transform: translateY(-2px);
  border-color: rgba(123, 97, 255, 0.18);
  box-shadow: 0 12px 30px rgba(123, 97, 255, 0.08);
}

.mentee-dashboard-workspace .mdw-action-link--primary {
  background: linear-gradient(135deg, #7b61ff 0%, #6a4df6 100%);
  color: #ffffff;
  border: none;
  box-shadow: 0 16px 32px rgba(123, 97, 255, 0.24);
}

.mentee-dashboard-workspace .mdw-action-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(123, 97, 255, 0.1);
  color: var(--mdw-purple);
}

.mentee-dashboard-workspace .mdw-action-link--primary .mdw-action-icon-wrap {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.mentee-dashboard-workspace .mdw-action-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-weight: 700;
  margin-top: 1rem;
}

.mentee-dashboard-workspace .mdw-activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mentee-dashboard-workspace .mdw-activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.95rem 0;
  border-bottom: 1px solid var(--mdw-border);
}

.mentee-dashboard-workspace .mdw-activity-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.mentee-dashboard-workspace .mdw-activity-badge {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mentee-dashboard-workspace .mdw-activity-badge--pending {
  background: var(--mdw-purple-soft);
  color: var(--mdw-purple);
}

.mentee-dashboard-workspace .mdw-activity-badge--upcoming {
  background: var(--mdw-green-soft);
  color: var(--mdw-green);
}

.mentee-dashboard-workspace .mdw-activity-badge--past {
  background: var(--mdw-yellow-soft);
  color: var(--mdw-yellow);
}

.mentee-dashboard-workspace .mdw-activity-badge--review {
  background: rgba(255, 208, 102, 0.16);
  color: #c98700;
}

.mentee-dashboard-workspace .mdw-activity-title {
  margin: 0;
  font-weight: 700;
  font-size: 0.96rem;
}

.mentee-dashboard-workspace .mdw-activity-desc {
  margin: 0.28rem 0 0;
  color: var(--mdw-muted);
  font-size: 0.88rem;
  line-height: 1.5;
}

.mentee-dashboard-workspace .mdw-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  background: var(--mdw-surface);
  border: 1px solid var(--mdw-border);
  border-radius: 24px;
}

@media (max-width: 1080px) {
  .mentee-dashboard-workspace .mdw-grid,
  .mentee-dashboard-workspace .mdw-bottom-grid,
  .mentee-dashboard-workspace .mdw-overview-board {
    grid-template-columns: 1fr;
  }

  .mentee-dashboard-workspace .mdw-action-list {
    grid-template-columns: 1fr;
  }

  .mentee-dashboard-workspace .mdw-mini-column {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: unset;
  }
}

@media (max-width: 720px) {
  .mentee-dashboard-workspace .mdw-shell {
    border-radius: 20px;
    padding: 0.9rem;
  }

  .mentee-dashboard-workspace .mdw-topbar,
  .mentee-dashboard-workspace .mdw-hero-head,
  .mentee-dashboard-workspace .mdw-panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .mentee-dashboard-workspace .mdw-mini-column {
    grid-template-columns: 1fr;
  }

  .mentee-dashboard-workspace .mdw-focus-number {
    font-size: 4rem;
  }

  .mentee-dashboard-workspace .mdw-hero-title {
    font-size: 1.65rem;
  }
}
`;

const MenteeDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [bRes, rRes] = await Promise.all([
          bookingApi.getMenteeBookings(user.id, 1, 100),
          reviewApi.getList({ menteeId: user.id, pageNumber: 1, pageSize: 1 }),
        ]);
        if (bRes.isSuccess && bRes.data?.items) {
          setBookings(bRes.data.items);
        }
        if (rRes.isSuccess && rRes.data) {
          setReviewCount(rRes.data.totalItems ?? rRes.data.items?.length ?? 0);
        } else {
          setReviewCount(0);
        }
      } catch (e) {
        console.error(e);
        setReviewCount(0);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user]);

  const now = Date.now();
  const pending = bookings.filter((b) => b.status === BookingStatus.Pending).length;
  const upcoming = bookings.filter(
    (b) => b.status === BookingStatus.Confirmed && new Date(b.scheduleStart).getTime() >= now
  ).length;
  const pastSessions = bookings.filter(
    (b) =>
      (b.status === BookingStatus.Confirmed && new Date(b.scheduleEnd).getTime() < now) ||
      b.status === BookingStatus.Rejected ||
      b.status === BookingStatus.Cancelled ||
      b.status === BookingStatus.Completed
  ).length;

  return (
    <>
      <style>{menteeDashboardWorkspaceCss}</style>

      <div
        className="animate-fade-in mentee-dashboard-workspace"
        style={{ maxWidth: '1200px' }}
      >
        <div>
          <div className="mdw-topbar">
            <div className="mdw-brand">
              <div className="mdw-brand-badge">M</div>
              <div>
                <p className="mdw-brand-title">Mentee Dashboard</p>
                <p className="mdw-brand-sub">Workspace overview</p>
              </div>
            </div>

            <div className="mdw-user-chip">
              <div className="mdw-user-avatar">
                {(user?.fullName?.trim()?.[0] ?? 'B').toUpperCase()}
              </div>
              <div>
                <p className="mdw-user-name">{user?.fullName ?? 'Bạn'}</p>
                <p className="mdw-user-sub">Mentee workspace</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mdw-loading">
              <Loader2 className="animate-spin" size={40} color="var(--mdw-purple)" />
            </div>
          ) : (
            <>
              <div className="mdw-grid">
                <div className="mdw-main-column">
                  <div className="mdw-card mdw-hero">
                    <div className="mdw-hero-head">
                      <div>
                      <h1 className="mdw-hero-title" style={{ color: '#111111' }}>
                        Xin chào, {user?.fullName?.split(' ')[0] ?? 'bạn'}!
                      </h1>
                        <p className="mdw-hero-desc">
                          Tổng quan lịch hẹn và đánh giá của bạn.
                        </p>
                      </div>
                      <div className="mdw-hero-chip">Dashboard overview</div>
                    </div>

                    <div className="mdw-overview-board">
                      <div className="mdw-focus-panel">
                        <div className="mdw-focus-top">
                          <div className="mdw-focus-label">
                            <Clock size={14} strokeWidth={2} />
                            Chờ mentor duyệt
                          </div>
                          <p className="mdw-focus-number">{pending}</p>
                          <p className="mdw-focus-caption">
                            Số lịch hẹn hiện đang ở trạng thái chờ xác nhận.
                          </p>
                        </div>

                        <div className="mdw-focus-bottom">
                          <div className="mdw-wave" />
                        </div>
                      </div>

                      <div className="mdw-mini-column">
                        <div className="mdw-mini-card mdw-mini-card--upcoming">
                          <div className="mdw-mini-top">
                            <div>
                              <p className="mdw-mini-label">Buổi sắp tới</p>
                              <p className="mdw-mini-value">{upcoming}</p>
                            </div>
                            <div className="mdw-mini-icon">
                              <Calendar size={18} strokeWidth={1.9} />
                            </div>
                          </div>
                        </div>

                        <div className="mdw-mini-card mdw-mini-card--past">
                          <div className="mdw-mini-top">
                            <div>
                              <p className="mdw-mini-label">Đã qua / hủy / từ chối</p>
                              <p className="mdw-mini-value">{pastSessions}</p>
                            </div>
                            <div className="mdw-mini-icon">
                              <Calendar size={18} strokeWidth={1.9} />
                            </div>
                          </div>
                        </div>

                        <div className="mdw-mini-card mdw-mini-card--reviews">
                          <div className="mdw-mini-top">
                            <div>
                              <p className="mdw-mini-label">Đánh giá đã gửi</p>
                              <p className="mdw-mini-value">{reviewCount ?? 0}</p>
                            </div>
                            <div className="mdw-mini-icon">
                              <Star size={18} strokeWidth={1.9} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mdw-card mdw-panel">
                    <div className="mdw-panel-head">
                      <div>
                        <h2 className="mdw-panel-title"style={{ color: '#111111' }}>Thao tác nhanh</h2>
                        <p className="mdw-panel-sub">
                          Đặt lịch mới, xem lịch đã đặt hoặc viết đánh giá sau buổi học.
                        </p>
                      </div>
                      <div className="mdw-dot-group" aria-hidden>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>

                    <div className="mdw-action-list">
                      <Link to="/mentee/browse" className="mdw-action-link mdw-action-link--primary">
                        <div className="mdw-action-icon-wrap">
                          <Users size={19} strokeWidth={1.9} />
                        </div>
                        <div className="mdw-action-title">
                          <span>Tìm mentor</span>
                          <ArrowRight size={16} strokeWidth={2} />
                        </div>
                      </Link>

                      <Link to="/mentee/bookings" className="mdw-action-link">
                        <div className="mdw-action-icon-wrap">
                          <Calendar size={19} strokeWidth={1.9} />
                        </div>
                        <div className="mdw-action-title">
                          <span>Lịch của tôi</span>
                          <ArrowRight size={16} strokeWidth={2} />
                        </div>
                      </Link>

                      <Link to="/mentee/reviews" className="mdw-action-link">
                        <div className="mdw-action-icon-wrap">
                          <Star size={19} strokeWidth={1.9} />
                        </div>
                        <div className="mdw-action-title">
                          <span>Đánh giá</span>
                          <ArrowRight size={16} strokeWidth={2} />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mdw-side-column">
                  <div className="mdw-card mdw-panel">
                    <div className="mdw-panel-head">
                      <div>
                        <h2 className="mdw-panel-title" style={{ color: '#111111' }}>Tổng quan nhanh</h2>
                        <p className="mdw-panel-sub">Các chỉ số chính của tài khoản hiện tại.</p>
                      </div>
                      <div className="mdw-dot-group" aria-hidden>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>

                    <div className="mdw-activity-list">
                      <div className="mdw-activity-item">
                        <div className="mdw-activity-badge mdw-activity-badge--pending">
                          <Clock size={18} strokeWidth={1.9} />
                        </div>
                        <div>
                          <p className="mdw-activity-title">Chờ mentor duyệt</p>
                          <p className="mdw-activity-desc">
                            Hiện có {pending} lịch hẹn đang chờ phản hồi từ mentor.
                          </p>
                        </div>
                      </div>

                      <div className="mdw-activity-item">
                        <div className="mdw-activity-badge mdw-activity-badge--upcoming">
                          <Calendar size={18} strokeWidth={1.9} />
                        </div>
                        <div>
                          <p className="mdw-activity-title">Buổi sắp tới</p>
                          <p className="mdw-activity-desc">
                            Bạn có {upcoming} buổi học đã xác nhận và chưa diễn ra.
                          </p>
                        </div>
                      </div>

                      <div className="mdw-activity-item">
                        <div className="mdw-activity-badge mdw-activity-badge--past">
                          <Calendar size={18} strokeWidth={1.9} />
                        </div>
                        <div>
                          <p className="mdw-activity-title">Đã qua / hủy / từ chối</p>
                          <p className="mdw-activity-desc">
                            Tổng số phiên đã kết thúc hoặc không diễn ra là {pastSessions}.
                          </p>
                        </div>
                      </div>

                      <div className="mdw-activity-item">
                        <div className="mdw-activity-badge mdw-activity-badge--review">
                          <Star size={18} strokeWidth={1.9} />
                        </div>
                        <div>
                          <p className="mdw-activity-title">Đánh giá đã gửi</p>
                          <p className="mdw-activity-desc">
                            Bạn đã gửi {reviewCount ?? 0} đánh giá sau các buổi học.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mdw-card mdw-panel">
                    <div className="mdw-panel-head">
                      <div>
                        <h2 className="mdw-panel-title" style={{ color: '#111111' }}>Trạng thái tài khoản</h2>
                        <p className="mdw-panel-sub">Hiển thị nhanh thông tin sử dụng hiện tại.</p>
                      </div>
                      <div className="mdw-dot-group" aria-hidden>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>

                    <div className="mdw-activity-list">
                      <div className="mdw-activity-item">
                        <div className="mdw-activity-badge mdw-activity-badge--pending">
                          <Users size={18} strokeWidth={1.9} />
                        </div>
                        <div>
                          <p className="mdw-activity-title">{user?.fullName ?? 'Bạn'}</p>
                          <p className="mdw-activity-desc">
                            Mọi dữ liệu hiển thị bên trái đang được lấy trực tiếp từ hệ thống.
                          </p>
                        </div>
                      </div>

                      <div className="mdw-activity-item">
                        <div className="mdw-activity-badge mdw-activity-badge--review">
                          <Star size={18} strokeWidth={1.9} />
                        </div>
                        <div>
                          <p className="mdw-activity-title">Review count</p>
                          <p className="mdw-activity-desc">
                            Giá trị hiện tại: {reviewCount ?? 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MenteeDashboardPage;