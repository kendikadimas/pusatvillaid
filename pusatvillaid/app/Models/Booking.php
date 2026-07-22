<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_code',
        'villa_id',
        'user_id',
        'payment_method_id',
        'voucher_id',
        'voucher_code',
        'discount_amount',
        'guest_name',
        'guest_email',
        'guest_phone',
        'check_in',
        'check_out',
        'total_nights',
        'num_guests',
        'base_price',
        'tax_amount',
        'admin_fee',
        'total_amount',
        'status',
        'payment_status',
        'notes',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'cancel_reason',
        'cancelled_at',
        'ktp_image',
    ];

    protected $casts = [
        'check_in' => 'date:Y-m-d',
        'check_out' => 'date:Y-m-d',
        'total_nights' => 'integer',
        'num_guests' => 'integer',
        'payment_method_id' => 'integer',
        'voucher_id' => 'integer',
        'discount_amount' => 'integer',
        'base_price' => 'decimal:2',
        'tax_amount' => 'integer',
        'admin_fee' => 'integer',
        'total_amount' => 'decimal:2',
        'cancelled_at' => 'datetime',
    ];

    public function villa(): BelongsTo
    {
        return $this->belongsTo(Villa::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function reviewToken(): HasOne
    {
        return $this->hasOne(ReviewToken::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }
}
