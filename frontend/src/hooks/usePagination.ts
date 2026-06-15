import { useState, useCallback } from 'react';

export function usePagination(totalPages: number = 1) {
    const [currentPage, setCurrentPage] = useState(1);

    const goNext = useCallback(() => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    }, [totalPages]);

    const goPrev = useCallback(() => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    }, []);

    const goTo = useCallback((page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    }, [totalPages]);

    return { currentPage, setCurrentPage: goTo, goNext, goPrev, totalPages };
}
