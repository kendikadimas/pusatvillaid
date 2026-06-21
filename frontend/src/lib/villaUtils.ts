import type { Villa } from '@/types';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80';
const PROD_STORAGE_URL = 'https://api.pusatvillaid.com/storage';
const LOCAL_API_URL = 'http://localhost:8000';

// Detect environment: if running in browser on localhost, use local API URL so admin thumbnails work
const isLocalDev =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/**
 * Normalise any image URL or path from the API into a fully-qualified URL
 * that works both in local development and in production.
 *
 * Handles:
 *  - Relative paths: "/storage/..." or "storage/..."
 *  - Absolute localhost URLs: "http://localhost:8000/storage/..."
 *  - Already-absolute production URLs: "https://api.pusatvillaid.com/storage/..."
 *  - External URLs (Unsplash, etc): returned as-is
 */
export function normaliseStorageUrl(url: string | null | undefined): string {
    if (!url) return FALLBACK_PHOTO;

    // Relative storage path → absolute
    if (url.startsWith('/storage/') || url.startsWith('storage/')) {
        const path = url.startsWith('/') ? url : '/' + url;
        return isLocalDev
            ? `${LOCAL_API_URL}${path}`
            : `${PROD_STORAGE_URL}${path.replace('/storage', '')}`;
    }

    // Localhost URL in production → rewrite to production storage
    if (!isLocalDev && url.includes('localhost:8000')) {
        return url.replace(/https?:\/\/localhost:8000\/storage\//, PROD_STORAGE_URL + '/');
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
