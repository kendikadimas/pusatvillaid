'use client';

import React, { useEffect, useState } from 'react';

interface AuthImageProps {
    src: string;
    alt: string;
    className?: string;
    onError?: () => void;
}

export default function AuthImage({ src, alt, className, onError }: AuthImageProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setBlobUrl(null);
        setError(false);

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_BACKEND_URL + '/api/v1');
        const token = typeof window !== 'undefined' ? (localStorage.getItem('admin_token') || localStorage.getItem('user_token')) : null;

        fetch(`${baseUrl}${src}`, {
            headers: token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' },
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.blob();
            })
            .then(blob => {
                if (!cancelled) setBlobUrl(URL.createObjectURL(blob));
            })
            .catch(() => {
                if (!cancelled) { setError(true); onError?.(); }
            });

        return () => { cancelled = true; if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [src]);

    if (error || !blobUrl) return null;

    return <img src={blobUrl} alt={alt} className={className} />;
}
