import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';
import type { TeacherResponseDto } from '../../types';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTeachers = async () => {
    try {
      const response = await adminApi.getAllTeachers(1, 100);
      if (response.isSuccess) {
        setTeachers(response.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter(t => 
    t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Teachers Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage faculty members and their specializations</p>
        </div>
        <button className="btn-primary">
          <Plus size={20} /> Add New Teacher
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--bg-tertiary)', display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
            <input 
              type="text" 
              className="input-field" 
              style={{ paddingLeft: '3rem' }} 
              placeholder="Search by name, email or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bg-tertiary)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Teacher</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Department</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Specialization</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading teachers...</td></tr>
              ) : filteredTeachers.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No teachers found.</td></tr>
              ) : filteredTeachers.map((teacher) => (
                <tr key={teacher.id} style={{ borderBottom: '1px solid var(--bg-tertiary)', transition: 'var(--transition)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden' }}>
                        {teacher.avatarUrl ? <img src={teacher.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : teacher.fullName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{teacher.fullName}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{teacher.department}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{teacher.specialization}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className={`status-badge ${teacher.isActive ? 'status-active' : 'status-inactive'}`}>
                      {teacher.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="nav-link" style={{ padding: '6px' }} title="Edit"><Edit2 size={16} /></button>
                      <button className="nav-link" style={{ padding: '6px' }} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeachersPage;
