import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext(null);

// Initialize user state from localStorage
const getInitialUser = () => {
    try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');
        if (storedUser && token) {
            return JSON.parse(storedUser);
        }
    } catch (error) {
        console.error('Error parsing stored user:', error);
    }
    return null;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getInitialUser);

    useEffect(() => {
        // Validate token on mount if user exists
        const currentUser = getInitialUser();
        if (currentUser) {
            authAPI.getProfile().catch(() => {
                // Token is invalid, clear auth state
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                setUser(null);
            });
        }
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authAPI.login(email, password);
            const { user, accessToken } = response.data.data;

            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('accessToken', accessToken);
            setUser(user);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};