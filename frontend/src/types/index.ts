export interface Villa {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    short_desc: string | null;
    location: string;
    maps_url: string | null;
    bedrooms: number;
    bathrooms: number;
    max_guests: number;
    price_per_night: number;
    weekend_price: number | null;
    min_nights: number;
    amenities: string[] | null;
    photos: string[] | null;
    rules: string | null;
    check_in_time: string;
    check_out_time: string;
    is_active: boolean;
    host_name?: string;
    host_years?: number;
    host_avatar?: string | null;
    highlights?: Array<{ icon: string; title: string; description: string }> | null;
    bedrooms_info?: Array<{ image: string; title: string; subtext: string }> | null;
    accessibility_features?: Array<{ image: string; title: string; subtext: string }> | null;
    host_joined_label?: string;
    host_is_verified?: boolean;
    host_about?: string[] | null;
    co_hosts?: Array<{ name: string; avatar: string }> | null;
    cancellation_policy?: string | null;
    safety_property?: string[] | null;
    neighborhood_desc?: string | null;
    reviews_avg_rating?: string | number | null;
    reviews_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Booking {
    id: number;
    booking_code: string;
    villa_id: number;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    check_in: string;
    check_out: string;
    total_nights: number;
    num_guests: number;
    base_price: number;
    total_amount: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    payment_status: 'unpaid' | 'paid' | 'refunded' | 'expired';
    notes: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    cancel_reason: string | null;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
    villa?: Villa;
    payment?: Payment;
    review?: Review;
}

export interface Payment {
    id: number;
    booking_id: number;
    midtrans_order_id: string;
    midtrans_transaction_id: string | null;
    payment_type: string | null;
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'expire' | 'cancel';
    snap_token: string | null;
    expired_at: string | null;
    paid_at: string | null;
    raw_response: any | null;
    created_at?: string;
    updated_at?: string;
}

export interface Review {
    id: number;
    booking_id: number;
    villa_id: number;
    guest_name: string;
    rating: number;
    comment: string;
    is_approved: boolean;
    approved_at: string | null;
    approved_by: number | null;
    created_at: string;
    updated_at: string;
    guest_avatar?: string | null;
    guest_subtitle?: string | null;
    villa?: Villa;
    booking?: Booking;
}

export interface BlockedDate {
    id: number;
    villa_id: number;
    date: string;
    reason: string | null;
    created_by: number;
    created_at?: string;
    updated_at?: string;
    villa?: {
        id: number;
        name: string;
    };
}

export interface Destination {
    id: number;
    name: string;
    city: string;
    query: string;
    image: string;
    count_fallback: string | null;
    created_at?: string;
    updated_at?: string;
}
