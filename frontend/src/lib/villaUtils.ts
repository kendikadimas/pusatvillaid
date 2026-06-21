import type { Villa } from '@/types';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * Normalise any image URL or path from the API into a fully-qualified URL
 * that works both in local development and in production.
 *
 * Handles:
 *  - Relative paths: "/storage/..." or "storage/..."
 *  - Absolute localhost URLs: "http://localhost:8000/storage/..."
 *  - Configured backend URLs: rewrites standard localhost:8000 to the current backend URL if they differ
 *  - External URLs (Unsplash, etc): returned as-is
 */
export function normaliseStorageUrl(url: string | null | undefined): string {
    if (!url) return FALLBACK_PHOTO;

    // Relative storage path → absolute
    if (url.startsWith('/storage/') || url.startsWith('storage/')) {
        const path = url.startsWith('/') ? url : '/' + url;
        return `${BACKEND_URL}${path}`;
    }

    // Rewrites hardcoded localhost URLs if backend runs on a different URL (e.g. production, staging, or local IP for mobile dev)
    if (url.includes('localhost:8000') && !BACKEND_URL.includes('localhost:8000')) {
        return url.replace(/https?:\/\/localhost:8000/, BACKEND_URL);
    }

    return url;
}

export function getPhotoUrl(photo: any): string {
    if (!photo) return FALLBACK_PHOTO;
    const raw = typeof photo === 'string' ? photo : (photo.url || FALLBACK_PHOTO);
    return normaliseStorageUrl(raw);
}

export function getPhotoDesc(photo: any): string {
    if (!photo || typeof photo === 'string') return '';
    return photo.description || '';
}

export function getPhotoCategory(photo: any): string {
    if (!photo || typeof photo === 'string') return 'Lainnya';
    return photo.category || 'Lainnya';
}

export function getMainPhoto(villa: Villa | null | undefined): string {
    if (!villa) return FALLBACK_PHOTO;
    if (villa.photos && villa.photos.length > 0) {
        return getPhotoUrl(villa.photos[0]);
    }
    return FALLBACK_PHOTO;
}
