import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingApi } from '../../api/booking';
import { adminApi } from '../../api/services';
import type { TeacherResponseDto, SlotResponseDto } from '../../types';
import { Calendar, Clock, UserPlus, Info, CheckCircle, Loader2, Mail, Plus, X } from 'lucide-react';

const BookMentorPage: React.FC = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState<TeacherResponseDto | null>(null);
  const [slots, setSlots] = useState<SlotResponseDto[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [participantEmails, setParticipantEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!mentorId) return;
      try {
        const [mentorRes, slotsRes] = await Promise.all([
          adminApi.getTeacherById(mentorId),
          bookingApi.getMentorSlots(mentorId)
        ]);
        if (mentorRes.isSuccess) setMentor(mentorRes.data);
        if (slotsRes.isSuccess) setSlots(slotsRes.data.filter(s => !s.isBooked));
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mentorId]);

  const addEmail = () => {
    if (newEmail && !participantEmails.includes(newEmail)) {
      setParticipantEmails([...participantEmails, newEmail]);
      setNewEmail('');
    }
  };

  const removeEmail = (email: string) => {
    setParticipantEmails(participantEmails.filter(e => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return alert('Please select a time slot.');
    setSubmitting(true);
    try {
      const response = await bookingApi.createBooking({
        mentorId,
        slotId: selectedSlot,
        topic,
        notes,
        participantEmails
      });
      if (response.isSuccess) {
        alert('Booking created successfully! The mentor will review your request.');
        navigate('/mentee/bookings');
      }
    } catch (err) {
      console.error('Failed to book:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}><Loader2 className="animate-spin" size={32} /></div>;
  if (!mentor) return <div>Mentor not found.</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1>Book a Session</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure your meeting details and invite teammates to join.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Step 1: Select Slot */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="var(--brand-primary)" /> 1. Select Available Slot
            </h3>
            {slots.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No available slots for this mentor.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                {slots.map(slot => (
                  <button 
                    key={slot.id}
                    className={`glass-card ${selectedSlot === slot.id ? 'active' : ''}`}
                    onClick={() => setSelectedSlot(slot.id)}
                    style={{ 
                      padding: '1rem', 
                      background: selectedSlot === slot.id ? 'rgba(88, 166, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: selectedSlot === slot.id ? '2px solid var(--brand-primary)' : '1px solid var(--glass-border)',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{new Date(slot.startAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {new Date(slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Meeting Info */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={20} color="var(--brand-primary)" /> 2. Meeting Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Topic</label>
                <input 
                  className="input-field" 
                  placeholder="What would you like to discuss?"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Notes (Optional)</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Share any specific questions or context..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Mentor Summary */}
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-tertiary)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {mentor.avatarUrl ? <img src={mentor.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : mentor.fullName.charAt(0)}
            </div>
            <h3 style={{ marginBottom: '0.25rem' }}>{mentor.fullName}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{mentor.specialization}</p>
          </div>

          {/* Step 3: Participants */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} color="var(--brand-primary)" /> Invite Others
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Add email addresses of teammates who should join this meeting.</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="email" 
                className="input-field" 
                style={{ padding: '0.5rem 0.75rem' }}
                placeholder="email@example.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
              />
              <button type="button" onClick={addEmail} className="btn-primary" style={{ padding: '0.5rem', minWidth: 'auto' }}>
                <Plus size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {participantEmails.map(email => (
                <div key={email} style={{ 
                  display: 'flex', alignItems: 'center', justifySelf: 'space-between', 
                  background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', 
                  borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem'
                }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</span>
                  <button onClick={() => removeEmail(email)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSubmit} 
            className="btn-primary" 
            style={{ width: '100%', padding: '1rem', justifyContent: 'center' }}
            disabled={submitting || !selectedSlot}
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle size={20} /> Confirm Booking</>}
          </button>
        </aside>
      </div>
    </div>
  );
};

export default BookMentorPage;
