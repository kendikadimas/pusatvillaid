'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PublicHeader from '@/components/PublicHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.replace('/profile');
            } else {
                router.replace('/login');
            }
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen bg-white">
            <PublicHeader />
            <LoadingSpinner />
        </div>
    );
}
