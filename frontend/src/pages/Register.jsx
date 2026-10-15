import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'customer'
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setSubmitting(true);
        try {
            await api.post('/auth/register', {
                name: formData.name.trim(),
                username: formData.username.trim(),
                email: formData.email.trim(),
                password: formData.password.trim(),
                role: formData.role
            });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Username or email may already be registered.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div className="panel" style={{ 
                maxWidth: '480px', 
                width: '100%', 
                padding: '2.5rem 2.25rem',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <div className="nav-brand-icon" style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '12px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Create Your Account</h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '4px' }}>
                        Join MarketHub for curated shopping or merchant fulfillment
                    </p>
                </div>

                {error && (
                    <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 600 }}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label>Full Legal Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Ananya Sharma" required />
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label>Username</label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="asharma" required />
                        </div>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label>Account Role</label>
                            <select name="role" value={formData.role} onChange={handleChange} required>
                                <option value="customer">Shopper / Customer</option>
                                <option value="seller">Merchant / Seller</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label>Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ananya@example.com" required />
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label>Password</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
                        </div>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label>Confirm Password</label>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required />
                        </div>
                    </div>
                    
                    <button type="submit" className="btn lg" style={{ width: '100%', marginTop: '0.75rem' }} disabled={submitting}>
                        {submitting ? 'Creating Membership...' : 'Complete Registration'}
                    </button>
                    
                    <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign In &rarr;</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
