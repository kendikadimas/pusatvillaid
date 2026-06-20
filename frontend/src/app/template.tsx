'use client';

import React, { useEffect, useState } from 'react';

export default function RootTemplate({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Trigger fade-in on mount
        requestAnimationFrame(() => setMounted(true));
        return () => setMounted(false);
    }, []);

    return (
        <div
            className={`transition-opacity duration-300 ease-out ${
                mounted ? 'opacity-100' : 'opacity-0'
            }`}
        >
            {children}
        </div>
    );
}
