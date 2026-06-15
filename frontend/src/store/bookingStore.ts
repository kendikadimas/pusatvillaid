import { create } from 'zustand';
import { Villa } from '@/types';
import { differenceInDays, parseISO, isFriday, isSaturday, eachDayOfInterval } from 'date-fns';

interface BookingState {
    selectedVilla: Villa | null;
    checkIn: string | null; // YYYY-MM-DD
    checkOut: string | null; // YYYY-MM-DD
    numGuests: number;
    notes: string;
    totalNights: number;
    totalAmount: number;
    isRefundable: boolean;
    priceBreakdown: {
        weekdays: { count: number; price: number; total: number };
        weekends: { count: number; price: number; total: number };
    };
    setVilla: (villa: Villa | null) => void;
    setDates: (checkIn: string | null, checkOut: string | null) => void;
    setNumGuests: (guests: number) => void;
    setNotes: (notes: string) => void;
    setRefundable: (isRefundable: boolean) => void;
    calculatePricing: () => void;
    resetStore: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
    selectedVilla: null,
    checkIn: null,
    checkOut: null,
    numGuests: 1,
    notes: '',
    totalNights: 0,
    totalAmount: 0,
    isRefundable: false,
    priceBreakdown: {
        weekdays: { count: 0, price: 0, total: 0 },
        weekends: { count: 0, price: 0, total: 0 },
    },

    setVilla: (villa) => {
        set({ selectedVilla: villa });
        get().calculatePricing();
    },

    setDates: (checkIn, checkOut) => {
        set({ checkIn, checkOut });
        get().calculatePricing();
    },

    setNumGuests: (numGuests) => set({ numGuests }),
    
    setNotes: (notes) => set({ notes }),

    setRefundable: (isRefundable) => {
        set({ isRefundable });
        get().calculatePricing();
    },

    calculatePricing: () => {
        const { selectedVilla, checkIn, checkOut, isRefundable } = get();

        if (!selectedVilla || !checkIn || !checkOut) {
            set({
                totalNights: 0,
                totalAmount: 0,
                priceBreakdown: {
                    weekdays: { count: 0, price: 0, total: 0 },
                    weekends: { count: 0, price: 0, total: 0 },
                },
            });
            return;
        }

        const start = parseISO(checkIn);
        const end = parseISO(checkOut);
        const totalNights = differenceInDays(end, start);

        if (totalNights <= 0) {
            set({
                totalNights: 0,
                totalAmount: 0,
                priceBreakdown: {
                    weekdays: { count: 0, price: 0, total: 0 },
                    weekends: { count: 0, price: 0, total: 0 },
                },
            });
            return;
        }

        // Loop through all nights (exclude checkout day itself)
        let weekdayCount = 0;
        let weekendCount = 0;

        // Generate intervals of each night
        const days = eachDayOfInterval({
            start,
            end: new Date(end.getTime() - 24 * 60 * 60 * 1000), // subDay
        });

        days.forEach((day) => {
            const dayOfWeek = day.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
            const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday and Saturday night
            
            if (isWeekend && selectedVilla.weekend_price !== null) {
                weekendCount++;
            } else {
                weekdayCount++;
            }
        });

        const weekdayPrice = Number(selectedVilla.price_per_night);
        const weekendPrice = selectedVilla.weekend_price !== null 
            ? Number(selectedVilla.weekend_price) 
            : weekdayPrice;

        const weekdayTotal = weekdayCount * weekdayPrice;
        const weekendTotal = weekendCount * weekendPrice;
        let totalAmount = weekdayTotal + weekendTotal;

        if (isRefundable) {
            const surchargeRate = selectedVilla.refundable_surcharge_rate ?? 0.1111;
            totalAmount = Math.round(totalAmount * (1 + surchargeRate));
        }

        set({
            totalNights,
            totalAmount,
            priceBreakdown: {
                weekdays: { count: weekdayCount, price: weekdayPrice, total: weekdayTotal },
                weekends: { count: weekendCount, price: weekendPrice, total: weekendTotal },
            },
        });
    },

    resetStore: () => set({
        selectedVilla: null,
        checkIn: null,
        checkOut: null,
        numGuests: 1,
        notes: '',
        totalNights: 0,
        totalAmount: 0,
        isRefundable: false,
        priceBreakdown: {
            weekdays: { count: 0, price: 0, total: 0 },
            weekends: { count: 0, price: 0, total: 0 },
        },
    }),
}));
