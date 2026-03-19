import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../api/booking';
import type { SlotResponseDto } from '../../types';
import { Calendar, Plus, Trash2, Loader2 } from 'lucide-react';

const SlotsPage: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<SlotResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' });

  const fetchSlots = async () => {
    if (!user) return;
    try {
      const response = await bookingApi.getMentorSlots(user.id);
      if (response.isSuccess) {
        setSlots(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [user]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const startAt = `${newSlot.date}T${newSlot.startTime}:00Z`;
      const endAt = `${newSlot.date}T${newSlot.endTime}:00Z`;
      const response = await bookingApi.createSlot({ startAt, endAt });
      if (response.isSuccess) {
        await fetchSlots();
        setNewSlot({ date: '', startTime: '', endTime: '' });
      }
    } catch (err) {
      console.error('Failed to add slot:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;
    try {
      const response = await bookingApi.deleteSlot(id);
      if (response.isSuccess) {
        setSlots(slots.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete slot:', err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Time Slots Management</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure your availability for students to book sessions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--brand-primary)" /> Your Active Slots
          </h3>
          
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /></div>
          ) : slots.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No slots created yet. Use the form to your right to add availability.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {slots.map((slot) => (
                <div key={slot.id} className="glass-card" style={{ 
                  padding: '1rem 1.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.02)',
                  borderLeft: slot.isBooked ? '4px solid var(--warning)' : '4px solid var(--success)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Date</div>
                      <div style={{ fontWeight: 600 }}>{new Date(slot.startAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Time</div>
                      <div style={{ fontWeight: 600 }}>
                        {new Date(slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div>
                      <span className={`status-badge ${slot.isBooked ? 'status-pending' : 'status-active'}`}>
                        {slot.isBooked ? 'Booked' : 'Available'}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="nav-link" 
                    style={{ color: 'var(--error)', padding: '8px' }}
                    onClick={() => handleDeleteSlot(slot.id)}
                    disabled={slot.isBooked}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} color="var(--brand-primary)" /> Add Availability
          </h3>
          <form onSubmit={handleAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={newSlot.date}
                onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                required 
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Start Time</label>
                <input 
                  type="time" 
                  className="input-field"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                  required 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>End Time</label>
                <input 
                  type="time" 
                  className="input-field"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '1rem' }} disabled={isAdding}>
              {isAdding ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={18} /> Add Slot</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SlotsPage;
