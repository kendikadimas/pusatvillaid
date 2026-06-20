<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'account_number',
        'account_name',
        'logo_url',
        'admin_fee',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'admin_fee' => 'integer',
    ];
}
