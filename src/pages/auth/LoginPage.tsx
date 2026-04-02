import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authApi } from "../../api/services";
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import "./LoginPage.css"; // Import file CSS mới

const LoginPage: React.FC = () => {
  // GIỮ NGUYÊN LOGIC CŨ
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // GIỮ NGUYÊN LOGIC CŨ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authApi.login({ email, password });
      if (response.isSuccess && response.data) {
        login(response.data.accessToken, response.data.refreshToken);
        // Navigate based on role if not coming from a specific page
        if (from === "/") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const role = (await import("jwt-decode")).jwtDecode<any>(response.data.accessToken)[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
          ];
          if (role == 1) navigate("/admin/dashboard");
          else if (role == 2) navigate("/mentor/dashboard");
          else navigate("/mentee/dashboard");
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setError(response.message || "Login failed. Please check your credentials.");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // CẬP NHẬT UI MỚI TẠI ĐÂY
  return (
    <div className="login-wrapper">
      <div className="login-glass-card animate-fade-in">
        <div className="login-header">
          <div className="login-icon-wrapper">
            <LogIn color="white" size={28} />
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to MentorBooking portal</p>
        </div>

        {error && (
          <div className="login-error-alert animate-slide-down">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-relative">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                className="custom-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="input-group">
            <div className="label-row">
              <label>Password</label>
              <a href="#forgot" className="forgot-link">
                Forgot password?
              </a>
            </div>
            <div className="input-relative">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                className="custom-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="login-footer">
          Don't have an account? <a href="#contact">Contact Administrator</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
