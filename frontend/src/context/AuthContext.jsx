import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(
        localStorage.getItem('token') || sessionStorage.getItem('token') || null
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser(decoded);
                }
            } catch (err) {
                logout();
            }
        }
        setLoading(false);
    }, [token]);

    const login = (newToken, userData = null, remember = true) => {
        if (remember) {
            localStorage.setItem('token', newToken);
            sessionStorage.removeItem('token');
        } else {
            sessionStorage.setItem('token', newToken);
            localStorage.removeItem('token');
        }
        setToken(newToken);
        if (userData) {
            setUser(userData);
        } else {
            try {
                setUser(jwtDecode(newToken));
            } catch (e) {
                console.error('Invalid token payload:', e);
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
