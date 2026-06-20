import type { Villa } from '@/types';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80';
const PROD_STORAGE_URL = 'https://api.pusatvillaid.com/storage';

export function getPhotoUrl(photo: any): string {
    if (!photo) return FALLBACK_PHOTO;
    let url: string;
    if (typeof photo === 'string') {
        url = photo;
    } else {
        url = photo.url || FALLBACK_PHOTO;
    }
    // Replace localhost URLs with production storage URL
    if (url.includes('localhost:8000')) {
        url = url.replace(/https?:\/\/localhost:8000\/storage\//, PROD_STORAGE_URL + '/');
    }
    return url;
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
