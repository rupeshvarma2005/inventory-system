import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Lock, Mail, ArrowRight, Eye, EyeOff, 
  Boxes, ShieldCheck, CheckCircle2, AlertCircle, 
  Sparkles, ShoppingBag, Truck, Store
} from 'lucide-react';
import api from '../api';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect message (e.g. from registration)
  const registrationSuccessMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier) {
      setError('Please enter your email address or username.');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);

    try {
      // Backend POST /api/auth/login accepts either email or username
      const httpClient = (api && typeof api.post === 'function') ? api : (api?.client || api);
      const res = await httpClient.post('/auth/login', {
        email: cleanIdentifier,
        username: cleanIdentifier,
        password: cleanPassword
      });

      const { token, user } = res.data;

      // Update authentication context and token persistence (remember me)
      login(token, user, rememberMe);

      // Prioritize previous protected route if user was redirected to login
      const fromPath = location.state?.from?.pathname;
      if (fromPath && fromPath !== '/login' && fromPath !== '/register') {
        navigate(fromPath, { replace: true });
        return;
      }

      // Role-based destination verified strictly from authenticated server response
      if (user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user?.role === 'seller') {
        navigate('/seller/dashboard', { replace: true });
      } else {
        // Customer shopping experience
        navigate('/storefront', { replace: true });
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || err.response.data?.message || 'Incorrect email or password. Please try again.');
      } else if (err.request) {
        setError('Cannot connect to authentication service. Please ensure server is running.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '88vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1.25rem',
      background: 'var(--bg)'
    }}>
      {/* Unified Main Container */}
      <div style={{
        maxWidth: '980px',
        width: '100%',
        borderRadius: '24px',
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))'
      }}>

        {/* ====================================================================
            LEFT COLUMN: Unified E-Commerce Login Form
            ==================================================================== */}
        <div style={{
          padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1.75rem, 4vw, 3rem)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Brand Header */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary), #0056B3)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)'
              }}>
                <Boxes size={22} strokeWidth={2.4} />
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
                Nex<span style={{ color: 'var(--primary)' }}>Stock</span>
              </span>
            </div>

            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              margin: '0 0 6px 0',
              color: 'var(--text)'
            }}>
              Sign In
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Welcome back! Please enter your account credentials to continue.
            </p>
          </div>

          {/* Registration Success Alert */}
          {registrationSuccessMessage && (
            <div style={{
              background: 'var(--good-soft)',
              color: 'var(--good)',
              border: '1px solid var(--good)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.86rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{registrationSuccessMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div style={{
              background: 'var(--danger-soft)',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.86rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Single Unified Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Email / Username Input */}
            <div className="form-group" style={{ margin: 0 }}>
              <label 
                htmlFor="user-identifier" 
                style={{ 
                  display: 'block',
                  fontSize: '0.84rem', 
                  fontWeight: 600, 
                  color: 'var(--text)', 
                  marginBottom: '6px' 
                }}
              >
                Email address or username
              </label>
              <div style={{ position: 'relative' }}>
                <Mail 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-dim)' 
                  }} 
                />
                <input
                  id="user-identifier"
                  type="text"
                  placeholder="name@example.com or username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError('');
                  }}
                  autoComplete="username"
                  required
                  style={{
                    width: '100%',
                    borderRadius: 'var(--radius-md)',
                    padding: '11px 14px 11px 40px',
                    fontSize: '0.92rem',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label 
                  htmlFor="user-password" 
                  style={{ 
                    fontSize: '0.84rem', 
                    fontWeight: 600, 
                    color: 'var(--text)', 
                    margin: 0 
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 4px'
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-dim)' 
                  }} 
                />
                <input
                  id="user-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%',
                    borderRadius: 'var(--radius-md)',
                    padding: '11px 14px 11px 40px',
                    fontSize: '0.92rem',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                />
              </div>
            </div>

            {/* Remember Me Option */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--primary)',
                    cursor: 'pointer'
                  }}
                />
                <span>Remember me</span>
              </label>

              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} style={{ color: 'var(--good)' }} />
                <span>Encrypted session</span>
              </span>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn lg"
              style={{
                width: '100%',
                borderRadius: 'var(--radius-full)',
                padding: '12px 24px',
                fontSize: '0.95rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '0.25rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* E-Commerce Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '2rem 0 1.25rem 0',
            color: 'var(--text-dim)',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            <span>New to NexStock?</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          </div>

          {/* Customer Registration Link */}
          <Link
            to="/register"
            className="btn secondary"
            style={{
              width: '100%',
              borderRadius: 'var(--radius-full)',
              padding: '10px 20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              textAlign: 'center',
              textDecoration: 'none',
              display: 'block'
            }}
          >
            Create an Account
          </Link>

          {/* Merchant Registration Link */}
          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            Selling on NexStock?{' '}
            <Link to="/seller/register" style={{ color: 'var(--accent, #f59e0b)', fontWeight: 600, textDecoration: 'none' }}>
              Register as Seller &rarr;
            </Link>
          </div>
        </div>

        {/* ====================================================================
            RIGHT COLUMN: Tasteful Shopping & Platform Showcase Visual
            ==================================================================== */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.05) 0%, rgba(0, 86, 179, 0.08) 100%)',
          borderLeft: '1px solid var(--border-subtle)',
          padding: 'clamp(2.5rem, 5vw, 3.5rem)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Decorative Glows */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 113, 227, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div>
            {/* Platform Tag */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--primary)',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <Sparkles size={13} />
              <span>Verified Multi-Hub Fulfillment</span>
            </div>

            {/* Visual Headline */}
            <h2 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 1.9rem)',
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: '-0.025em',
              color: 'var(--text)',
              marginBottom: '1rem'
            }}>
              Everything You Need. <br />
              <span style={{ color: 'var(--primary)' }}>Delivered with Speed.</span>
            </h2>

            <p style={{
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              marginBottom: '2rem'
            }}>
              Connect seamlessly to your personalized shopping portal, merchant workspace, or administrative operations console with one unified secure account.
            </p>

            {/* 3 E-Commerce Value Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(0, 113, 227, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShoppingBag size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                    Live Inventory Stock Guarantee
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Stock is reserved in real time upon checkout.
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(52, 199, 89, 0.1)',
                  color: 'var(--good)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Truck size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                    Nearest-Warehouse Routing
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Orders route to the closest hub for express delivery.
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: 'var(--accent, #f59e0b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Store size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                    Integrated Multi-Tenant Platform
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Seamless role detection for customers, sellers &amp; admins.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Badge */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
              Protected Platform Access
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>256-bit SSL Encrypted</span>
          </div>
        </div>

      </div>
    </div>
  );
}
