import type { Villa } from '@/types';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80';

export function getPhotoUrl(photo: any): string {
    if (!photo) return FALLBACK_PHOTO;
    if (typeof photo === 'string') return photo;
    return photo.url || FALLBACK_PHOTO;
}

export function getPhotoDesc(photo: any): string {
    if (!photo || typeof photo === 'string') return '';
    return photo.description || '';
}

export function getMainPhoto(villa: Villa | null | undefined): string {
    if (!villa) return FALLBACK_PHOTO;
    if (villa.photos && villa.photos.length > 0) {
        return getPhotoUrl(villa.photos[0]);
    }
    return FALLBACK_PHOTO;
}
