import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Clock, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';

const FEATURES = [
  { icon: <Clock size={18} />,       title: 'Smart Attendance',    desc: 'Check-in/out with live timestamp tracking' },
  { icon: <Calendar size={18} />,    title: 'Leave Management',    desc: 'Apply, approve, and track leave effortlessly' },
  { icon: <DollarSign size={18} />,  title: 'Payroll Engine',      desc: 'Auto-calculate PF, PT, and net pay' },
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      login(response);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh' }}>
      {/* Left panel */}
      <div className="login-panel-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: 'white',
            }}>E</div>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>EmPay</span>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.03em' }}>
            Simplify HR.<br />Empower People.
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 16, lineHeight: 1.6, marginBottom: 48 }}>
            A complete HR management system — from attendance tracking to payroll processing, all in one platform.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'rgba(79, 70, 229, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#A5B4FC', flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{f.title}</div>
                  <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Demo credentials hint */}
          <div style={{
            marginTop: 48,
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
          }}>
            <div style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Demo Credentials</div>
            {[
              ['Admin', 'admin@empay.com', 'Admin@123'],
              ['HR Officer', 'hr@empay.com', 'Hr@123'],
              ['Payroll Officer', 'payroll@empay.com', 'Payroll@123'],
              ['Employee', 'employee@empay.com', 'Employee@123'],
            ].map(([role, email, pwd]) => (
              <div
                key={role}
                onClick={() => { setEmail(email); setPassword(pwd); }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer', transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <span style={{ color: '#CBD5E1', fontSize: 12 }}>{role}</span>
                <span style={{ color: '#64748B', fontSize: 11, fontFamily: 'monospace' }}>{email}</span>
              </div>
            ))}
            <p style={{ color: '#475569', fontSize: 11, marginTop: 8 }}>Click any row to auto-fill credentials</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-panel-right">
        <div style={{ width: '100%', maxWidth: 400 }} className="fade-in">
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Welcome back
            </h2>
            <p style={{ color: '#64748B', marginTop: 6, fontSize: 15 }}>
              Sign in to access your EmPay workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="form-label">Email address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8,
                padding: '10px 14px', color: '#991B1B', fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15 }}
            >
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#64748B' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>
              Create account
            </Link>
          </div>

          {/* Security note */}
          <div style={{
            marginTop: 32, display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', background: '#F0FDF4', borderRadius: 8,
          }}>
            <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0 }} />
            <span style={{ color: '#065F46', fontSize: 12 }}>
              Secured with JWT authentication. All data is role-protected.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
