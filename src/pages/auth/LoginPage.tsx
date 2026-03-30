import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/services';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authApi.login({ email, password });
      if (response.isSuccess && response.data) {
        login(response.data.accessToken, response.data.refreshToken);
        // Navigate based on role if not coming from a specific page
        if (from === '/') {
          const role = (await import('jwt-decode')).jwtDecode<any>(response.data.accessToken)["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
          if (role == 1) navigate('/admin/dashboard');
          else if (role == 2) navigate('/mentor/dashboard');
          else navigate('/mentee/dashboard');
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="login-container">
      <div className="glass-card login-box animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '1rem', 
            background: 'var(--brand-gradient)', 
            borderRadius: '1rem',
            marginBottom: '1rem',
            boxShadow: '0 8px 16px rgba(31, 111, 235, 0.3)'
          }}>
            <LogIn color="white" size={32} />
          </div>
          <h1>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Sign in to MentorBooking portal</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(248, 81, 73, 0.1)', 
            border: '1px solid var(--error)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)',
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
              <input 
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '3rem' }}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '3rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ justifyContent: 'center', width: '100%', padding: '1rem', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </button>
        </form>
        
        <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <a href="#" style={{ fontWeight: 600 }}>Contact Administrator</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
