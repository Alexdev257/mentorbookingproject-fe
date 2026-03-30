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
    <div className="animate-fade-in" style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
          Xin chào, {user?.fullName?.split(' ')[0] ?? 'bạn'}!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Tổng quan lịch hẹn và đánh giá của bạn — dữ liệu lấy trực tiếp từ API.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={40} color="var(--brand-primary)" />
        </div>
      ) : (
        <>
          <div className="dashboard-grid">
            <div
              className="glass-card"
              style={{
                padding: '1.75rem',
                background:
                  'linear-gradient(135deg, rgba(88, 166, 255, 0.12) 0%, rgba(31, 111, 235, 0.06) 100%)',
              }}
            >
              <h3
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.75rem',
                }}
              >
                Chờ mentor duyệt
              </h3>
              <span style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1 }}>{pending}</span>
              <Clock size={16} style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }} />
            </div>
            <div
              className="glass-card"
              style={{
                padding: '1.75rem',
                background:
                  'linear-gradient(135deg, rgba(63, 185, 80, 0.12) 0%, rgba(63, 185, 80, 0.05) 100%)',
              }}
            >
              <h3
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.75rem',
                }}
              >
                Buổi sắp tới
              </h3>
              <span style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1 }}>{upcoming}</span>
              <Calendar size={16} style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }} />
            </div>
            <div
              className="glass-card"
              style={{
                padding: '1.75rem',
                background:
                  'linear-gradient(135deg, rgba(219, 171, 9, 0.12) 0%, rgba(219, 171, 9, 0.05) 100%)',
              }}
            >
              <h3
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.75rem',
                }}
              >
                Đã qua / hủy / từ chối
              </h3>
              <span style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1 }}>
                {pastSessions}
              </span>
              <Calendar size={16} style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }} />
            </div>
            <div
              className="glass-card"
              style={{
                padding: '1.75rem',
                background:
                  'linear-gradient(135deg, rgba(163, 113, 247, 0.12) 0%, rgba(163, 113, 247, 0.05) 100%)',
              }}
            >
              <h3
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.75rem',
                }}
              >
                Đánh giá đã gửi
              </h3>
              <span style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1 }}>
                {reviewCount ?? 0}
              </span>
              <Star size={16} style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div
            className="glass-card"
            style={{
              marginTop: '2rem',
              padding: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ marginBottom: '0.35rem', fontSize: '1.25rem' }}>Thao tác nhanh</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Đặt lịch mới, xem lịch đã đặt hoặc viết đánh giá sau buổi học.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Link to="/mentee/browse" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} /> Tìm mentor
              </Link>
              <Link
                to="/mentee/bookings"
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                }}
              >
                <Calendar size={18} /> Lịch của tôi
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/mentee/reviews"
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                }}
              >
                <Star size={18} /> Đánh giá
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MenteeDashboardPage;
