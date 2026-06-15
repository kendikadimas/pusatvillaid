import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export function useWishlist() {
    const [wishlist, setWishlist] = useState<number[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('pusatvilla_wishlist');
        if (saved) {
            try {
                setWishlist(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse wishlist:', e);
            }
        }
    }, []);

    const toggleWishlist = useCallback((id: number, e: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();

        let updated: number[];
        if (wishlist.includes(id)) {
            updated = wishlist.filter(item => item !== id);
            toast.success('Dihapus dari daftar keinginan');
        } else {
            updated = [...wishlist, id];
            toast.success('Disimpan ke daftar keinginan!');
        }
        setWishlist(updated);
        localStorage.setItem('pusatvilla_wishlist', JSON.stringify(updated));
    }, [wishlist]);

    const isWished = useCallback((id: number) => wishlist.includes(id), [wishlist]);

    return { wishlist, toggleWishlist, isWished };
}
