import React, { useState, useEffect } from 'react';
import { bookingApi } from '../../api/booking';
import type { BookingResponseDto } from '../../types';
import { Calendar, Clock, User, Link as LinkIcon, Loader2, Star, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const response = await bookingApi.getMenteeBookings();
      if (response.isSuccess) {
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

  const getStatusDisplay = (status: number) => {
    switch (status) {
      case 1: return { label: 'Pending', class: 'status-pending', icon: <Clock size={14} /> };
      case 2: return { label: 'Accepted', class: 'status-active', icon: <CheckCircle2 size={14} /> };
      case 3: return { label: 'Rejected', class: 'status-inactive', icon: <XCircle size={14} /> };
      case 4: return { label: 'Cancelled', class: 'status-inactive', icon: <AlertCircle size={14} /> };
      default: return { label: 'Unknown', class: 'status-inactive', icon: null };
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1>My Bookings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your session requests and upcoming meetings with mentors.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}><Loader2 className="animate-spin" size={32} /></div>
      ) : bookings.length === 0 ? (
        <div className="glass-card" style={{ padding: '5rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Calendar size={40} color="var(--text-muted)" />
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>No Bookings Yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>You haven't requested any sessions yet. Browse mentors to get started!</p>
          <a href="/mentee/browse" className="btn-primary">Find a Mentor</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {bookings.map((booking) => {
            const status = getStatusDisplay(booking.status);
            return (
              <div key={booking.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', transition: 'var(--transition)' }}>
                <div style={{ width: 60, height: 60, borderRadius: 'var(--radius-md)', background: 'rgba(88, 166, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={30} color="var(--brand-primary)" />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem' }}>{booking.topic || 'Mentoring Session'}</h3>
                    <span className={`status-badge ${status.class}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} /> {new Date(booking.scheduleStart).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} /> 
                      {new Date(booking.scheduleStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(booking.scheduleEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Star size={14} /> Mentor ID: {booking.mentorId.substring(0, 8)}...
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  {booking.status === 2 && booking.meetingLink && (
                    <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary">
                      <LinkIcon size={18} /> Join Meet
                    </a>
                  )}
                  {booking.status === 1 && (
                    <button className="nav-link" style={{ color: 'var(--error)' }}>Cancel Request</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
