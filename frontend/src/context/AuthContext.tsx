'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosClient from '@/lib/axios';
import { useRouter, usePathname } from 'next/navigation';

export interface AdminUser {
    id: number;
    name: string;
    email: string;
}

interface AuthContextType {
    admin: AdminUser | null;
    user: any | null;
    loading: boolean;
    error: any;
    login: (credentials: { email: string; password: string; remember?: string }) => Promise<any>;
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
        try {
            const response = await axiosClient.get('/user');
            setUser(response.data);
        } catch (err) {
            setUser(null);
        }
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
        const response = await axiosClient.post('/register', credentials);
        return response.data;
    };

    const resendEmailVerification = async () => {
        const response = await axiosClient.post('/email/verification-notification');
        return response.data;
    };

    const refreshAdmin = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
            setAdmin(null);
            setLoading(false);
            return;
        }

        try {
            // Our Axios interceptor automatically attaches the token
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshAdmin();
    }, []);

    // Handle Admin Route Protection
    useEffect(() => {
        if (loading) return;

        const isAdminRoute = pathname.startsWith('/admin');
        const isLoginRoute = pathname === '/admin/login';

        if (isAdminRoute) {
            if (!admin && !isLoginRoute) {
                router.push('/admin/login');
            } else if (admin && isLoginRoute) {
                router.push('/admin/dashboard');
            }
        }
    }, [admin, loading, pathname, router]);

    const login = async (credentials: { email: string; password: string; remember?: string }) => {
        setError(null);
        try {
            const response = await axiosClient.post('/admin/login', credentials);
            const { token, user } = response.data;
            
            if (typeof window !== 'undefined') {
                localStorage.setItem('admin_token', token);
            }
            
            setAdmin(user);
            router.push('/admin/dashboard');
            return response.data;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Email atau password salah.');
            throw err;
        }
    };

    const logout = async () => {
        try {
            await axiosClient.post('/admin/logout');
        } catch (err) {
            // Ignore logout API failures and clear token locally
            console.error('Logout API failed:', err);
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('admin_token');
            }
            setAdmin(null);
            router.push('/admin/login');
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
