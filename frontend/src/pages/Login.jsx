import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const trimmedUsername = username.trim();
            const trimmedPassword = password.trim();
            const res = await api.post('/auth/login', { username: trimmedUsername, password: trimmedPassword });
            login(res.data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
        } finally {
            setSubmitting(false);
        }
    };

    const fillDemo = (u, p) => {
        setUsername(u);
        setPassword(p);
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div className="panel" style={{ 
                maxWidth: '440px', 
                width: '100%', 
                padding: '2.75rem 2.25rem',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="nav-brand-icon" style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '12px', fontSize: '1.5rem' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Welcome Back</h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '4px' }}>
                        Sign in to access your MarketHub privileges &amp; bag
                    </p>
                </div>

                {error && (
                    <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label>Username / Email</label>
                        <input
                            type="text"
                            placeholder="e.g. rahul.sharma or seller1"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn lg" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
                        {submitting ? 'Authenticating...' : 'Sign In to Account'}
                    </button>
                </form>

                {/* Quick Demo Credentials */}
                <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>
                        Quick Demo Credentials:
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button 
                            type="button" 
                            className="btn secondary sm" 
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => fillDemo('admin', 'admin123')}
                        >
                            Admin
                        </button>
                        <button 
                            type="button" 
                            className="btn secondary sm" 
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => fillDemo('seller1', 'seller123')}
                        >
                            Seller
                        </button>
                        <button 
                            type="button" 
                            className="btn secondary sm" 
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => fillDemo('customer1', 'customer123')}
                        >
                            Customer
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                    New to MarketHub? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Create an account &rarr;</Link>
                </div>
            </div>
        </div>
    );
}
