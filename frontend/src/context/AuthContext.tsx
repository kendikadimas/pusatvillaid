'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosClient from '@/lib/axios';
import { useRouter, usePathname } from 'next/navigation';

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface AuthContextType {
    admin: AdminUser | null;
    user: any | null;
    loading: boolean;
    error: any;
    login: (credentials: { email: string; password: string; remember?: string }, isAdmin?: boolean) => Promise<any>;
    logout: () => Promise<void>;
    refreshAdmin: () => Promise<void>;
    forgotPassword: (email: string) => Promise<any>;
    resetPassword: (credentials: any) => Promise<any>;
    register: (credentials: any) => Promise<any>;
    resendEmailVerification: () => Promise<any>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();

    const refreshUser = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
        if (!token) {
            setUser(null);
            return;
        }

        const response = await axiosClient.get('/user');
        setUser(response.data);
    };

    const forgotPassword = async (email: string) => {
        const response = await axiosClient.post('/forgot-password', { email });
        return response.data;
    };

    const resetPassword = async (credentials: any) => {
        const response = await axiosClient.post('/reset-password', credentials);
        return response.data;
    };

    const register = async (credentials: any) => {
        setError(null);
        try {
            const response = await axiosClient.post('/register', credentials);
            const { token, user: userData } = response.data;
            
            if (typeof window !== 'undefined') {
                localStorage.setItem('user_token', token);
            }
            
            setUser(userData);
            
            // Check if there is a redirect path
            const searchParams = new URLSearchParams(window.location.search);
            const redirect = searchParams.get('redirect');
            if (redirect) {
                router.push(redirect);
            } else {
                router.push('/profile');
            }
            
            return response.data;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registrasi gagal.');
            throw err;
        }
    };

    const resendEmailVerification = async () => {
        const response = await axiosClient.post('/email/verification-notification');
        return response.data;
    };

    const refreshAdmin = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
            setAdmin(null);
            return;
        }

        try {
            const response = await axiosClient.get('/admin/me');
            setAdmin(response.data);
            setError(null);
        } catch (err: any) {
            setAdmin(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('admin_token');
            }
            if (err.response?.status !== 401) {
                setError(err);
            }
        }
    };

    // Combined initial loading
    useEffect(() => {
        const initAuth = async () => {
            setLoading(true);
            try {
                await Promise.all([refreshAdmin(), refreshUser()]);
            } catch {
                // Individual refresh functions handle their own errors
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    // Safety net: re-fetch user if token exists but user is null
    useEffect(() => {
        if (loading) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
        if (token && !user) {
            refreshUser().catch(() => {});
        }
    }, [user, loading]);

    // Handle Admin Route Protection
    useEffect(() => {
        if (loading) return;

        const isAdminRoute = pathname.startsWith('/admin');
        const isLoginRoute = pathname === '/admin/login';

        if (isAdminRoute) {
            if (!admin || admin.role !== 'admin') {
                if (!isLoginRoute) {
                    router.push('/admin/login');
                }
            } else if (isLoginRoute) {
                router.push('/admin/dashboard');
            }
        }
    }, [admin, loading, pathname, router]);

    const login = async (credentials: { email: string; password: string; remember?: string }, isAdmin?: boolean) => {
        setError(null);
        try {
            const isCurrentPathAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
            const targetIsAdmin = isAdmin !== undefined ? isAdmin : isCurrentPathAdmin;
            
            const endpoint = targetIsAdmin ? '/admin/login' : '/login';
            const response = await axiosClient.post(endpoint, credentials);
            const { token, user: userData } = response.data;
            const isAdminUser = userData?.role === 'admin';
            
            if (typeof window !== 'undefined') {
                if (targetIsAdmin || isAdminUser) {
                    localStorage.setItem('admin_token', token);
                    setAdmin(userData);
                } else {
                    localStorage.setItem('user_token', token);
                    setUser(userData);
                }
            }
            
            if (targetIsAdmin || isAdminUser) {
                router.push('/admin/dashboard');
            } else {
                const searchParams = new URLSearchParams(window.location.search);
                const redirect = searchParams.get('redirect');
                if (redirect) {
                    router.push(redirect);
                } else {
                    router.push('/profile');
                }
            }
            
            return response.data;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Email atau password salah.');
            throw err;
        }
    };

    const logout = async () => {
        console.log('[Auth] Logout called');
        const isCurrentPathAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
        const endpoint = isCurrentPathAdmin ? '/admin/logout' : '/logout';
        
        console.log('[Auth] Is admin path:', isCurrentPathAdmin);
        console.log('[Auth] Endpoint:', endpoint);
        
        // Clear state immediately
        if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('user_token');
            console.log('[Auth] Tokens cleared');
        }
        
        // Fire API call in background (don't wait)
        console.log('[Auth] Firing logout API call');
        axiosClient.post(endpoint)
            .then(() => console.log('[Auth] Logout API success'))
            .catch(err => console.error('[Auth] Logout API error:', err));
        
        // Force redirect with full page reload
        if (typeof window !== 'undefined') {
            const redirectUrl = isCurrentPathAdmin ? '/admin/login' : '/login';
            console.log('[Auth] Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                admin,
                user,
                loading,
                error,
                login,
                logout,
                refreshAdmin,
                forgotPassword,
                resetPassword,
                register,
                resendEmailVerification,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
