import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Layers, ArrowRight, Store, UserCheck, ShieldCheck } from 'lucide-react';
import api from '../api';

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSellerReg = location.pathname.includes('/seller');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setSubmitting(true);
    try {
      const endpoint = isSellerReg ? '/auth/register-seller' : '/auth/register';
      const httpClient = (api && typeof api.post === 'function') ? api : (api?.client || api);
      await httpClient.post(endpoint, {
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password.trim()
      });

      // Redirect to login with friendly message
      navigate('/login', { 
        state: { 
          message: isSellerReg 
            ? 'Merchant registration successful! Please sign in to access your Seller Workspace.' 
            : 'Account registered successfully! Please sign in with your email and password.' 
        } 
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Username or email may already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.25rem', background: 'var(--bg)' }}>
      <div style={{ 
        maxWidth: '520px', 
        width: '100%', 
        padding: '2.75rem 2.5rem',
        borderRadius: '24px',
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border)',
        animation: 'appleFadeIn 0.35s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            margin: '0 auto 16px',
            borderRadius: '14px',
            background: isSellerReg ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, var(--primary), #0056B3)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isSellerReg ? '0 8px 20px -4px rgba(245, 158, 11, 0.4)' : '0 8px 20px -4px rgba(0, 113, 227, 0.4)'
          }}>
            {isSellerReg ? <Store size={26} strokeWidth={2.2} /> : <Layers size={26} strokeWidth={2.2} />}
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, margin: 0, color: 'var(--text)' }}>
            {isSellerReg ? 'Merchant Onboarding' : 'Create Customer Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '8px' }}>
            {isSellerReg 
              ? 'Register your business to list products and fulfill customer orders'
              : 'Join NexStock to curate collections, track orders, and experience express checkout'
            }
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'var(--danger-soft, #fee2e2)', 
            color: 'var(--danger, #dc2626)', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            marginBottom: '1.5rem', 
            fontSize: '0.88rem', 
            fontWeight: 600,
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px', display: 'block' }}>
              {isSellerReg ? 'Merchant / Business Contact Name' : 'Full Name'}
            </label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder={isSellerReg ? 'e.g. Apex Retailers or Priya Mehta' : 'e.g. Ananya Sharma'} 
              required 
              style={{ 
                width: '100%',
                borderRadius: '12px', 
                padding: '11px 14px', 
                fontSize: '0.92rem',
                border: '1.5px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)'
              }} 
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px', display: 'block' }}>
              Account Username
            </label>
            <input 
              type="text" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              placeholder={isSellerReg ? 'apex_store' : 'asharma'} 
              required 
              style={{ 
                width: '100%',
                borderRadius: '12px', 
                padding: '11px 14px', 
                fontSize: '0.92rem',
                border: '1.5px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)'
              }} 
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px', display: 'block' }}>
              Email Address
            </label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder={isSellerReg ? 'merchant@apexstore.com' : 'ananya@example.com'} 
              required 
              style={{ 
                width: '100%',
                borderRadius: '12px', 
                padding: '11px 14px', 
                fontSize: '0.92rem',
                border: '1.5px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)'
              }} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px', display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="Min 6 chars" 
                  required 
                  style={{ 
                    width: '100%',
                    borderRadius: '12px', 
                    padding: '11px 36px 11px 14px', 
                    fontSize: '0.92rem',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }} 
                />
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px', display: 'block' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  placeholder="Repeat" 
                  required 
                  style={{ 
                    width: '100%',
                    borderRadius: '12px', 
                    padding: '11px 36px 11px 14px', 
                    fontSize: '0.92rem',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }} 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '-4px' }}>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 0'
              }}
            >
              {showPassword ? 'Hide passwords' : 'Show passwords'}
            </button>
          </div>
          
          <button 
            type="submit" 
            className="btn" 
            style={{ 
              width: '100%', 
              marginTop: '0.5rem', 
              borderRadius: '12px', 
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: isSellerReg ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--primary)',
              color: '#FFFFFF',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.75 : 1,
              boxShadow: isSellerReg ? '0 4px 14px rgba(245, 158, 11, 0.35)' : '0 4px 14px rgba(0, 113, 227, 0.35)'
            }} 
            disabled={submitting}
          >
            {submitting ? 'Creating Membership...' : (isSellerReg ? 'Complete Merchant Onboarding' : 'Complete Registration')}
            {!submitting && <ArrowRight size={17} />}
          </button>
          
          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
          </div>

          <div style={{ marginTop: '0.25rem', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-dim)' }}>
            {isSellerReg ? (
              <>Looking to shop as a customer? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create Customer Account</Link></>
            ) : (
              <>Want to sell on NexStock? <Link to="/seller/register" style={{ color: 'var(--accent, #f59e0b)', fontWeight: 600 }}>Register as Seller &rarr;</Link></>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
