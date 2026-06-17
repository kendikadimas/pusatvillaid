<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'midtrans_order_id',
        'midtrans_transaction_id',
        'payment_type',
        'amount',
        'status',
        'snap_token',
        'payment_proof',
        'rejection_reason',
        'expired_at',
        'paid_at',
        'rejected_at',
        'raw_response',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expired_at' => 'datetime',
        'paid_at' => 'datetime',
        'rejected_at' => 'datetime',
        'raw_response' => 'array',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
