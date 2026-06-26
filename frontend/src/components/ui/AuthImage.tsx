'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios';

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

        axiosClient.get(src, { responseType: 'blob' })
            .then(res => {
                if (!cancelled) setBlobUrl(URL.createObjectURL(res.data));
            })
            .catch(() => {
                if (!cancelled) { setError(true); onError?.(); }
            });

        return () => { cancelled = true; if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [src]);

    if (error || !blobUrl) return null;

    return <img src={blobUrl} alt={alt} className={className} />;
}
