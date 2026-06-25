export function formatPrice(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined) return 'Rp 0';
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

export function formatPriceOrLoading(amount: number | string | null | undefined, loading: boolean): string {
    if (loading) return 'Memuat...';
    return formatPrice(amount);
}
