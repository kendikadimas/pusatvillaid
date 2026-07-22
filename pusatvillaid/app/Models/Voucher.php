<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'max_discount',
        'min_booking_amount',
        'usage_limit',
        'used_count',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'integer',
        'max_discount' => 'integer',
        'min_booking_amount' => 'integer',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Calculate the discount amount for a given booking total.
     */
    public function calculateDiscount(int $bookingAmount): int
    {
        if ($this->discount_type === 'percentage') {
            $discount = (int) round($bookingAmount * $this->discount_value / 100);
            if ($this->max_discount) {
                $discount = min($discount, $this->max_discount);
            }

            return $discount;
        }

        // fixed
        return min($this->discount_value, $bookingAmount);
    }

    /**
     * Check if voucher is currently valid (active, within date range, usage not exceeded).
     */
    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = now();

        if ($this->valid_from && $now->lt($this->valid_from)) {
            return false;
        }

        if ($this->valid_until && $now->gt($this->valid_until)) {
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }
}
