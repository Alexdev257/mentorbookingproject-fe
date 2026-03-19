import React, { useState, useEffect } from 'react';
import { bookingApi } from '../../api/booking';
import type { BookingResponseDto } from '../../types';
import { Check, X, Calendar, Clock, User, Link as LinkIcon, Loader2 } from 'lucide-react';

const BookingRequestsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const response = await bookingApi.getMentorBookings();
      if (response.isSuccess) {
        // Status: 1 = Pending, 2 = Accepted, 3 = Rejected, 4 = Cancelled
        setBookings(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    setProcessingId(id);
    try {
      const response = action === 'accept' 
        ? await bookingApi.acceptBooking(id) 
        : await bookingApi.rejectBooking(id, 'Requested by mentor');
      
      if (response.isSuccess) {
        await fetchBookings();
      }
    } catch (err) {
      console.error(`Failed to ${action} booking:`, err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Booking Requests</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Review and manage session requests from students</p>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bg-tertiary)' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mentee</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Schedule</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Topic</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Link / Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center' }}>Loading requests...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No booking requests found.</td></tr>
            ) : bookings.map((booking) => (
              <tr key={booking.id} style={{ borderBottom: '1px solid var(--bg-tertiary)' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} />
                    </div>
                    <span style={{ fontWeight: 600 }}>Mentee User</span>
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} className="text-secondary" />
                    {new Date(booking.scheduleStart).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    <Clock size={14} />
                    {new Date(booking.scheduleStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                   <div style={{ fontWeight: 500 }}>{booking.topic || 'No topic specified'}</div>
                   <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{booking.notes}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span className={`status-badge ${
                    booking.status === 1 ? 'status-pending' : 
                    booking.status === 2 ? 'status-active' : 
                    'status-inactive'
                  }`}>
                    {booking.status === 1 ? 'Pending' : booking.status === 2 ? 'Accepted' : booking.status === 3 ? 'Rejected' : 'Cancelled'}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  {booking.status === 1 ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '0.5rem', minWidth: 'auto', background: 'var(--success)' }}
                        onClick={() => handleAction(booking.id, 'accept')}
                        disabled={processingId === booking.id}
                      >
                        {processingId === booking.id ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />}
                      </button>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '0.5rem', minWidth: 'auto', background: 'var(--error)' }}
                        onClick={() => handleAction(booking.id, 'reject')}
                        disabled={processingId === booking.id}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : booking.status === 2 && booking.meetingLink ? (
                    <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                      <LinkIcon size={14} /> Join Meeting
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingRequestsPage;
