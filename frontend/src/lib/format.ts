export function formatPrice(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined) return 'Rp 0';
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
}
