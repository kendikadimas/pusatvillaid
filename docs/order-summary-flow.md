# Order Summary / Ringkasan Pesanan — Data Flow & Code Reference

## Table of Contents

1. [Overview](#overview)
2. [File Index](#file-index)
3. [Data Flow Diagram](#data-flow-diagram)
4. [Frontend: Booking Initiation (Villa Detail Page)](#frontend-booking-initiation)
5. [Frontend: Zustand Booking Store (Pricing Engine)](#frontend-zustand-booking-store)
6. [Frontend: Confirm Page (Order Summary Display)](#frontend-confirm-page)
7. [Frontend: Post-Booking Pages](#frontend-post-booking-pages)
8. [Frontend: Shared Components & Utilities](#frontend-shared-components--utilities)
9. [Backend: BookingController (Server-Side Pricing)](#backend-bookingcontroller)
10. [Shared Types](#shared-types)
11. [Optimization Opportunities](#optimization-opportunities)

---

## Overview

The order summary flow covers the complete lifecycle of a villa booking:

1. **Initiation** — User selects dates on the villa detail page; pricing is calculated client-side
2. **Confirmation** — User reviews the price breakdown on `/booking/confirm`; enters guest details, uploads KTP, selects payment method
3. **Submission** — Booking is submitted to backend via `POST /api/v1/bookings`; server re-calculates pricing independently
4. **Payment** — User redirected to `/booking/payment` to upload proof of transfer
5. **Status/Success** — User views final receipt and can download invoice PDF

---

## File Index

### Frontend (`frontend/`)

| # | File Path | Role | Lines |
|---|-----------|------|-------|
| 1 | `src/app/villas/[slug]/VillaDetailPageClient.tsx` | Entry point: date selection, booking initiation | 111–990 |
| 2 | `src/store/bookingStore.ts` | Client-side pricing state (Zustand + persist) | 1–158 |
| 3 | `src/app/booking/confirm/page.tsx` | **Main order summary page** | 1–1542 |
| 4 | `src/app/booking/payment/page.tsx` | Payment page (post-create) | 1–708 |
| 5 | `src/app/booking/status/page.tsx` | Booking status + billing summary | 1–449 |
| 6 | `src/app/booking/success/page.tsx` | Success receipt page | 1–283 |
| 7 | `src/components/BookingSummaryCard.tsx` | Reusable villa thumbnail card | 1–73 |
| 8 | `src/components/ui/CountdownTimer.tsx` | 30-min hold timer | — |
| 9 | `src/components/ui/StatusBadge.tsx` | Booking/payment status badge | — |
| 10 | `src/context/SettingsContext.tsx` | Tax percentage & site settings | 1–74 |
| 11 | `src/types/index.ts` | TypeScript interfaces | 1–152 |
| 12 | `src/lib/format.ts` | Price formatting utilities | 1–9 |
| 13 | `src/lib/villaUtils.ts` | Photo URL helpers | 1–55 |
| 14 | `src/lib/generateInvoicePDF.ts` | PDF invoice generator | 1–339 |
| 15 | `src/lib/axios.ts` | Axios HTTP client | 1–51 |

### Backend (`pusatvillaid/`)

| # | File Path | Role | Lines |
|---|-----------|------|-------|
| 16 | `app/Http/Controllers/BookingController.php` | Store, show, userBookings, confirm manual payment | 1–493 |
| 17 | `routes/api.php` | API route definitions | — |

---

## Data Flow Diagram

```
Villa Detail Page                   Confirm Page                     Backend
┌─────────────────────┐            ┌──────────────────────┐        ┌─────────────────────┐
│ User selects dates   │            │ Read Zustand store:  │        │                     │
│ & guests             │───────────▶│ • selectedVilla      │        │                     │
│                      │            │ • checkIn/checkOut   │        │                     │
│ Store updated:       │            │ • totalAmount (base) │        │                     │
│ setDates() ────────▶ │            │ • priceBreakdown     │        │                     │
│ calculatePricing()  │            │ • totalNights        │        │                     │
│                      │            │                      │        │                     │
│ bookingStore.ts:     │            │ Fetch (parallel):    │        │                     │
│ • weekday/weekend    │            │ ┌──────────────────┐ │        │                     │
│ • totalAmount (base) │            │ │ GET /payment-    │ │        │                     │
│ • priceBreakdown     │            │ │ methods          │─┼───────▶│ PaymentMethodController
│                      │            └──────────────────┘ │        │ .indexPublic()      │
│                      │            ┌──────────────────┐ │        │                     │
│                      │            │ GET /settings/    │ │        │                     │
│                      │            │ public            │─┼───────▶│ SettingController   │
│                      │            └──────────────────┘ │        │ .indexPublic()      │
└─────────────────────┘            └──────────────────────┘        └─────────────────────┘
                                            │                                │
                                            │ User clicks "Konfirmasi & Bayar"│
                                            ▼                                ▼
                                   ┌──────────────────────┐        ┌─────────────────────┐
                                   │ Pre-check avail.:    │        │ BookingController   │
                                   │ GET /villas/{slug}/  │───────▶│ .store()            │
                                   │ availability         │        │ • Recalculate base  │
                                   │                      │        │ • weekend/weekday   │
                                   │ Submit POST /bookings│        │ • refundable surch. │
                                   │ (FormData with KTP)  │───────▶│ • tax_amount        │
                                   │                      │        │ • admin_fee         │
                                   └──────────────────────┘        │ • total_amount      │
                                                                     │ • Insert Booking    │
                                            │                        └─────────────────────┘
                                            ▼                                   │
                                   ┌──────────────────────┐                    │
                                   │ Redirect to          │◄───────────────────┘
                                   │ /booking/payment     │     returns booking_code
                                   │ ?code=VB-2026-XXXX  │
                                   └──────────────────────┘
                                            │
                                            ▼
                                   ┌──────────────────────┐
                                   │ Payment Page         │
                                   │ GET /bookings/{code} │────▶ Backend .show()
                                   │ (server data)        │     returns full booking
                                   │ Show total_amount    │
                                   │ Upload proof         │
                                   └──────────────────────┘
                                            │
                                            ▼
                                   ┌──────────────────────┐
                                   │ Status/Success Page  │
                                   │ GET /bookings/{code} │────▶ Backend .show()
                                   │ Show billing summary │     base_price, tax_amount,
                                   │ Download invoice PDF │     admin_fee, total_amount
                                   └──────────────────────┘
```

---

## Frontend: Booking Initiation

### File: `frontend/src/app/villas/[slug]/VillaDetailPageClient.tsx`

**Entry point** for the booking flow. User selects check-in/check-out dates and guest count, then clicks "Pesan."

#### Key sections:

**State & Store Setup (lines 156–167):**
```typescript
const {
    setVilla: setStoreVilla,
    setDates: setStoreDates,
    setNumGuests,
    checkIn: storeCheckIn,
    checkOut: storeCheckOut,
    numGuests: storeNumGuests,
    totalNights,
    totalAmount,
    priceBreakdown,
    isRefundable,
} = useBookingStore();
```

**Fetch Villa + Availability (lines 284–335):**
```typescript
// Fetch villa details and availability in parallel
const [res, availRes] = await Promise.all([
    axiosClient.get(`/villas/${slug}`),
    axiosClient.get(`/villas/${slug}/availability`).catch(() => ({ data: { disabled_dates: [] } })),
]);

setVilla(res.data.villa);
setStoreVilla(res.data.villa);
```

**Date Selection → Store Update (lines 360–395):**
```typescript
const handleSelectRange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
        // check disabled dates overlap...
        setStoreDates(checkInStr, checkOutStr);
    }
};
```

**Booking Submit → Redirect (lines 397–404):**
```typescript
const handleBookingSubmit = () => {
    if (!storeCheckIn || !storeCheckOut) { ... }
    router.push('/booking/confirm');
};
```

**Price Breakdown Display in Sidebar (lines 646–683):**
```typescript
{totalNights > 0 && (
    <div>
        {priceBreakdown.weekdays.count > 0 && (
            <div>Weekday ({formatPrice(priceBreakdown.weekdays.price)} x {count})</div>
        )}
        {priceBreakdown.weekends.count > 0 && (
            <div>Weekend ({formatPrice(priceBreakdown.weekends.price)} x {count})</div>
        )}
        {isRefundable && <div>Pilihan tarif (+...%)</div>}
        <div>Sebelum pajak: {formatPrice(totalAmount)}</div>
    </div>
)}
```

---

## Frontend: Zustand Booking Store

### File: `frontend/src/store/bookingStore.ts`

**The single source of truth** for all booking pricing data on the client side. Persisted to localStorage under key `pusatvilla-booking-store`.

#### Full Implementation:

```typescript
interface BookingState {
    selectedVilla: Villa | null;
    checkIn: string | null;        // YYYY-MM-DD
    checkOut: string | null;
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
```

**`calculatePricing()` — Core pricing logic (lines 63–137):**
```typescript
calculatePricing: () => {
    const { selectedVilla, checkIn, checkOut, isRefundable } = get();

    const start = parseISO(checkIn);
    const end = parseISO(checkOut);
    const totalNights = differenceInDays(end, start);

    // Loop through all nights
    let weekdayCount = 0;
    let weekendCount = 0;
    const days = eachDayOfInterval({
        start,
        end: new Date(end.getTime() - 24 * 60 * 60 * 1000),
    });

    days.forEach((day) => {
        const dayOfWeek = day.getDay();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday & Saturday
        if (isWeekend && selectedVilla.weekend_price !== null) {
            weekendCount++;
        } else {
            weekdayCount++;
        }
    });

    const weekdayPrice = Number(selectedVilla.price_per_night);
    const weekendPrice = selectedVilla.weekend_price ?? weekdayPrice;

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
```

**`setDates()` triggers recalc (lines 49–52):**
```typescript
setDates: (checkIn, checkOut) => {
    set({ checkIn, checkOut });
    get().calculatePricing();
},
```

**`resetStore()` — clears all data (lines 139–152):**
```typescript
resetStore: () => set({
    selectedVilla: null,
    checkIn: null, checkOut: null,
    numGuests: 1, notes: '',
    totalNights: 0, totalAmount: 0,
    isRefundable: false,
    priceBreakdown: { weekdays: { count: 0, price: 0, total: 0 }, weekends: {...} },
}),
```

**Persist middleware (lines 154–157):**
```typescript
persist(
    (set, get) => ({ ... }),
    { name: 'pusatvilla-booking-store' }
)
```

#### Important Notes:
- `totalAmount` only represents **base price** (weekday + weekend + optional refundable surcharge)
- Tax and admin fee are calculated **on the confirm page**, not in the store
- Data survives page refresh via localStorage, but can become stale if:
  - Villa price changes between sessions
  - Tax percentage changes between sessions
  - User navigates directly to `/booking/confirm` without selecting dates first

---

## Frontend: Confirm Page

### File: `frontend/src/app/booking/confirm/page.tsx`

The main order summary page. Full file is **1542 lines**. Renders completely client-side.

#### Data Flow:

**Step 1 — Read Zustand Store (lines 41–54):**
```typescript
const {
    selectedVilla, checkIn, checkOut, numGuests, notes,
    totalNights, totalAmount, priceBreakdown,
    setNumGuests, setNotes, resetStore, isRefundable
} = useBookingStore();
```

**Step 2 — Fetch Payment Methods (lines 186–201):**
```typescript
useEffect(() => {
    const fetchMethods = async () => {
        const response = await axiosClient.get('/payment-methods');
        setPaymentMethods(response.data);
        if (response.data.length > 0) setSelectedMethodId(response.data[0].id);
    };
    fetchMethods();
}, []);
```

**Step 3 — Fetch Tax Settings (lines 203–216):**
```typescript
useEffect(() => {
    const fetchSettings = async () => {
        const response = await axiosClient.get('/settings/public');
        setTaxPercentage(response.data.tax_percentage);
    };
    fetchSettings();
}, []);
```

**Step 4 — Calculate Final Total (lines 225–229):**
```typescript
const baseTotal = totalAmount;
const taxAmount = Math.round((taxPercentage / 100) * baseTotal);
const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);
const adminFee = selectedMethod?.admin_fee || 0;
const finalTotalAmount = methodsLoading ? null : Math.round(baseTotal + taxAmount + adminFee);
```

**Step 5 — Render Price Breakdown (lines 855–891 Desktop, 1258–1293 Mobile):**
```tsx
<div className="space-y-3 text-xs font-semibold text-slate-550">
    {priceBreakdown.weekdays.count > 0 && (
        <div>
            <span>{count} malam x {formatPrice(price)} (Weekday)</span>
            <span>{formatPrice(weekdayTotal)}</span>
        </div>
    )}
    {priceBreakdown.weekends.count > 0 && (
        <div>
            <span>{count} malam x {formatPrice(price)} (Weekend)</span>
            <span>{formatPrice(weekendTotal)}</span>
        </div>
    )}
    {isRefundable && (
        <div>
            <span>Pilihan tarif (Bisa dikembalikan +11.1%)</span>
            <span>+{formatPrice(Math.round(baseTotal * 0.11111))}</span>
        </div>
    )}
    {taxPercentage > 0 && (
        <div>
            <span>Pajak ({taxPercentage}%)</span>
            <span>+{formatPrice(taxAmount)}</span>
        </div>
    )}
    {adminFee > 0 && (
        <div>
            <span>Biaya Admin ({selectedMethod?.name})</span>
            <span>+{formatPrice(adminFee)}</span>
        </div>
    )}
</div>
<div>
    <span>Total Biaya</span>
    <span>{formatPriceOrLoading(finalTotalAmount, methodsLoading)}</span>
</div>
```

**Step 6 — Availability Pre-check (lines 300–324):**
```typescript
// Before submitting, check if dates are still available
const availRes = await axiosClient.get(`/villas/${selectedVilla.slug}/availability`);
const disabledDates = availRes.data.disabled_dates || [];
const selectedDates = eachDayOfInterval({
    start: parseISO(checkIn),
    end: subDays(parseISO(checkOut), 1)
});
const conflict = selectedDates.find(d => disabledDates.includes(format(d, 'yyyy-MM-dd')));
if (conflict) {
    toast.error('Tanggal sudah tidak tersedia');
    resetStore(); router.push(`/villas/${selectedVilla.slug}`);
    return;
}
```

**Step 7 — Submit Booking (lines 280–372):**
```typescript
const payload = new FormData();
payload.append('villa_id', String(selectedVilla.id));
payload.append('payment_method_id', String(selectedMethodId));
payload.append('guest_name', name);
payload.append('guest_email', email);
payload.append('guest_phone', phone);
payload.append('check_in', checkIn);
payload.append('check_out', checkOut);
payload.append('num_guests', String(numGuests));
payload.append('is_refundable', isRefundable ? '1' : '0');
if (ktpFile) payload.append('ktp_image', ktpFile);

const response = await axiosClient.post('/bookings', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
});

router.push(`/booking/payment?code=${response.data.booking_code}`);
```

#### Layout:
- **Desktop (≥768px):** Two-column layout; left = form (payment method, guest details, KTP, terms), right = sticky sidebar with `BookingSummaryCard` + price breakdown
- **Mobile (<768px):** 3-step wizard; step 1 = contact + KTP, step 2 = payment method, step 3 = review & confirm

---

## Frontend: Post-Booking Pages

### Payment Page — `frontend/src/app/booking/payment/page.tsx`

**Purpose:** Show invoice after booking is created, accept proof of payment upload.

**Data source:** `GET /api/v1/bookings/{code}?email=...` (line 125–127)
```typescript
const response = await axiosClient.get(`/bookings/${code}`, {
    params: { email }
});
```

**Shows:**
- Villa name, duration, guest count from `booking` data
- `total_amount` (line 440–443): `formatPrice(booking.total_amount)`
- Payment method details (account number, QRIS code)
- Proof of payment upload form

**Redirects:**
- If `payment_status === 'paid'` → `/booking/success?code=...` (line 133)
- If `status === 'cancelled'` → `/booking/failed?code=...` (line 139)

### Status Page — `frontend/src/app/booking/status/page.tsx`

**Purpose:** Display full billing summary after booking is created. Email-verified gate.

**Data source:** `GET /api/v1/bookings/{code}?email=...` (line 83–86)
```typescript
const response = await axiosClient.get(`/bookings/${code}`, {
    params: { email }
});
```

**Shows "Ringkasan Tagihan" (lines 346–414):**
```tsx
{/* Billing Summary */}
<div>Nama Tamu: {booking.guest_name}</div>
<div>Nomor WA: {booking.guest_phone}</div>
<div>Durasi: {booking.total_nights} malam</div>
<div>Tamu: {booking.num_guests} orang</div>

{/* Price breakdown from server data */}
<div>Harga Sewa: {formatPrice(booking.base_price)}</div>
{booking.tax_amount > 0 && <div>Pajak: {formatPrice(booking.tax_amount)}</div>}
{booking.admin_fee > 0 && <div>Biaya Admin: {formatPrice(booking.admin_fee)}</div>}
<div>Total Biaya: {formatPrice(booking.total_amount)}</div>
```

### Success Page — `frontend/src/app/booking/success/page.tsx`

**Purpose:** Receipt after payment is confirmed. Download PDF, share via WhatsApp.

**Data source:** `GET /api/v1/bookings/{code}?email=...` (lines 42–44)

**Shows price breakdown (lines 201–222):**
```tsx
{booking.base_price && <div>Harga Sewa: {formatPrice(booking.base_price)}</div>}
{booking.tax_amount > 0 && <div>Pajak: {formatPrice(booking.tax_amount)}</div>}
{booking.admin_fee > 0 && <div>Biaya Admin: {formatPrice(booking.admin_fee)}</div>}
<div>Total Terbayar: {formatPrice(booking.total_amount)}</div>
```

---

## Frontend: Shared Components & Utilities

### BookingSummaryCard — `frontend/src/components/BookingSummaryCard.tsx`

Reusable card showing villa thumbnail, name, location, and optional date range.

**Two variants:**
- **Normal (lines 52–72):** Used in desktop sidebar. Shows thumbnail, villa name, location (short), rating.
- **Compact (lines 27–49):** Horizontal layout, used on mobile. Shows thumbnail, villa name, location, date range.

```typescript
interface BookingSummaryCardProps {
    villa: Villa;
    checkIn?: string;
    checkOut?: string;
    mainPhoto?: string;
    compact?: boolean;
}
```

### SettingsContext — `frontend/src/context/SettingsContext.tsx`

Fetches `GET /api/v1/settings/public` once on mount. Provides `tax_percentage`, `settings_prop_name`, etc. throughout the app.

```typescript
const refreshSettings = async () => {
    const response = await axiosClient.get('/settings/public');
    setSettings(response.data);
};
```

### generateInvoicePDF — `frontend/src/lib/generateInvoicePDF.ts`

Generates an A4 PDF invoice using jsPDF + html2canvas. Called from:
- `success/page.tsx:74` — after payment success
- `status/page.tsx:422` — on "Download Invoice PDF" button

```typescript
export async function generateInvoicePDF(
    booking: InvoiceBooking,
    bookingCode: string,
    invoiceSettings?: InvoiceSettings
) {
    const pdf = new jsPDF('p', 'mm', 'a4');
    // ... renders header, guest info, villa info, booking details,
    //     payment breakdown (base_price, tax, admin_fee, total_amount)
    pdf.save(`Invoice-${bookingCode}-${date}.pdf`);
}
```

### Axios Client — `frontend/src/lib/axios.ts`

Shared HTTP client configured with:
- `baseURL` from `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_BACKEND_URL + '/api/v1'`
- Auth token injection via request interceptor
- 401/403 auto-redirect for admin endpoints

```typescript
const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_BACKEND_URL + '/api/v1'),
});
```

### API Routes — `frontend/src/routes/index.ts`

Wayfinder-generated route functions. Imported as `import { ... } from '@/routes'`.

---

## Backend: BookingController

### File: `pusatvillaid/app/Http/Controllers/BookingController.php`

### `store()` Method (lines 30–230)

**Validates input** (lines 32–47):
```php
'villa_id' => 'required|exists:villas,id',
'payment_method_id' => 'sometimes|nullable|exists:payment_methods,id',
'guest_name' => 'required|string|max:255',
'guest_email' => 'required|email|max:255',
'guest_phone' => 'required|string|max:20',
'check_in' => 'required|date|after_or_equal:today',
'check_out' => 'required|date|after:check_in',
'num_guests' => 'required|integer|min:1',
'ktp_image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
'is_refundable' => 'nullable|boolean',
```

**Transaction block with race-condition protection** (lines 84–207):

1. **Overlapping booking check** (lines 86–111):
```php
$overlappingBookings = Booking::where('villa_id', $villa->id)
    ->where(function ($q) {
        $q->whereIn('status', ['confirmed', 'completed'])
            ->orWhere(function ($q2) {
                $q2->where('status', 'pending')
                    ->where('payment_status', 'pending');
            });
    })
    ->where(function ($query) use ($checkIn, $checkOut) {
        // overlapping date range check
    })
    ->lockForUpdate()
    ->exists();
```

2. **Blocked dates check** (lines 114–120):
```php
$blockedDatesExist = BlockedDate::where('villa_id', $villa->id)
    ->whereBetween('date', [$checkIn, Carbon::parse($checkOut)->subDay()])
    ->exists();
```

3. **Server-side pricing calculation** (lines 122–148):
```php
// Calculate base amount (weekday vs weekend)
$baseAmount = 0;
$period = CarbonPeriod::create($checkIn, Carbon::parse($checkOut)->subDay());
foreach ($period as $date) {
    $isWeekend = $date->isFriday() || $date->isSaturday();
    if ($isWeekend && $villa->weekend_price !== null) {
        $baseAmount += $villa->weekend_price;
    } else {
        $baseAmount += $villa->price_per_night;
    }
}

if ($request->input('is_refundable')) {
    $baseAmount = round($baseAmount * 1.11111);
}

// Tax
$taxPercentage = (int) Setting::getValue('tax_percentage', 0);
$taxAmount = round(($taxPercentage / 100) * $baseAmount);

// Admin fee
$paymentMethod = PaymentMethod::find($request->payment_method_id);
$adminFee = $paymentMethod ? $paymentMethod->admin_fee : 0;

// Final total
$totalAmount = $baseAmount + $taxAmount + $adminFee;
```

4. **Insert booking record** (lines 181–204):
```php
$booking = Booking::create([
    'booking_code' => $bookingCode,
    'villa_id' => $villa->id,
    ...
    'base_price' => $villa->price_per_night, // Note: this is price_per_night, NOT total base
    'tax_amount' => $taxAmount,
    'admin_fee' => $adminFee,
    'total_amount' => $totalAmount,
    'status' => 'pending',
    'payment_status' => 'unpaid',
    'ktp_image' => $ktpImagePath,
]);
```

5. **Admin notification email** (lines 209–219)

6. **Response** (lines 221–225):
```php
return response()->json([
    'booking_code' => $bookingData->booking_code,
    'total_amount' => $bookingData->total_amount,
    'message' => 'Booking berhasil dibuat. Silakan unggah bukti pembayaran.',
], 201);
```

### `show()` Method (lines 235–269)

Fetches full booking details for post-booking pages:
```php
public function show(string $code, Request $request): JsonResponse
{
    $email = $request->query('email');
    $user = auth('sanctum')->user();

    $query = Booking::where('booking_code', $code);
    // ... authorization logic based on user role & email
    $booking = $query->with(['villa', 'payment', 'paymentMethod'])->first();

    return response()->json($booking);
}
```

---

## Shared Types

### File: `frontend/src/types/index.ts`

```typescript
export interface Villa {
    id: number;
    name: string;
    slug: string;
    price_per_night: number;
    weekend_price: number | null;
    min_nights: number;
    refundable_surcharge_rate?: number;
    cleaning_fee?: number | null;
    photos: Array<string | { url: string; ... }> | null;
    // ... other fields
}

export interface Booking {
    id: number;
    booking_code: string;
    check_in: string;
    check_out: string;
    total_nights: number;
    num_guests: number;
    base_price: number;        // Server-side: villa.price_per_night (NOT total base)
    total_amount: number;      // Server-side: base + tax + admin_fee
    tax_amount?: number;
    admin_fee?: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    payment_status: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'expired';
    villa?: Villa;
    payment?: Payment;
    payment_method?: PaymentMethod | null;
    // ... other fields
}

export interface PaymentMethod {
    id: number;
    name: string;
    code: string;
    account_number: string;
    account_name: string;
    logo_url: string | null;
    admin_fee: number;
    is_active: boolean;
}
```

---

## Optimization Opportunities

### Speed Issues

| Issue | Location | Severity | Suggestion |
|-------|----------|----------|------------|
| **2 separate API calls** on confirm page | `confirm/page.tsx:186-216` | High | Create single `GET /checkout-data` endpoint returning `{ payment_methods, settings }` |
| **Client-side pricing duplicated** | `bookingStore.ts` vs `BookingController.php` | High | Replace with server endpoint `POST /calculate-price` — send `{ villa_id, dates, refundable }` → server returns full breakdown |
| **No SSR/RSC** — full `'use client'` | `confirm/page.tsx:1` | Medium | Use Next.js server components for static shell + React.lazy for interactive parts |
| **finalTotalAmount hidden during loading** | `confirm/page.tsx:229` | Medium | Show skeleton or estimated total immediately; update when API returns |
| **setInterval timer always runs** | `confirm/page.tsx:168-183` | Low | Use `document.visibilitychange` to pause/resume timer |
| **Availability pre-check before submit** | `confirm/page.tsx:300-324` | Low | Run availability check on confirm page mount (parallel with other fetches), not at submit time |

### Accuracy Issues

| Issue | Location | Severity | Suggestion |
|-------|----------|----------|------------|
| **`base_price` DB field is wrong** | `BookingController.php:193` | High | Store computed total base price (weekday + weekend + optional refundable), not `villa.price_per_night` |
| **Pricing logic duplicated** | `bookingStore.ts:63-137` vs `BookingController.php:122-148` | High | Single source of truth on server; client only shows server-calculated values |
| **Tax/admin_fee could change between load & submit** | `confirm/page.tsx:203-216` | Medium | Add `POST /calculate-price` call at submit time to show real-time total before final confirmation |
| **No price validation on submit** | `confirm/page.tsx:280-372` | Medium | Include expected price breakdown in submit payload; server should verify it matches server-side calculation |
| **Store data can be stale** | `bookingStore.ts:154-157` | Medium | Invalidate localStorage cache if `selectedVilla` data is older than N minutes; re-fetch villa detail on confirm page mount |

### Recommended Architecture Change

**Replace client-side pricing with server-side pricing endpoint:**

```
Frontend                          Backend
  │                                 │
  ├─ POST /calculate-price ────────▶│
  │   { villa_id, check_in,         │  • Lookup villa + payment method
  │     check_out, payment_method,  │  • Calculate base (weekday/weekend)
  │     is_refundable }             │  • Apply refundable surcharge
  │                                 │  • Calculate tax + admin fee
  │◀────────────────────────────────│  • Return full breakdown
  │   { weekdays, weekends,         │
  │     baseTotal, taxAmount,       │
  │     adminFee, finalTotal }      │
  │                                 │
```

Benefits:
- Single source of truth for pricing
- No duplicate logic between frontend & backend
- Always real-time pricing
- Can cache `/calculate-price` responses server-side
- Reduces client bundle size (remove date-fns? No, still needed for calendar)
- Eliminates Zustand persist overhead for pricing data
