<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Villa extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'short_desc',
        'location',
        'maps_url',
        'bedrooms',
        'bathrooms',
        'max_guests',
        'price_per_night',
        'weekend_price',
        'min_nights',
        'amenities',
        'photos',
        'rules',
        'check_in_time',
        'check_out_time',
        'is_active',
        'host_name',
        'host_years',
        'host_avatar',
        'host_phone',
        'highlights',
        'bedrooms_info',
        'accessibility_features',
        'host_joined_label',
        'host_is_verified',
        'host_about',
        'co_hosts',
        'cancellation_policy',
        'safety_property',
        'neighborhood_desc',
        'refundable_surcharge_rate',
        'cancellation_free_days',
        'beds',
        'cleaning_fee',
        'destination_id',
    ];

    protected $casts = [
        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
        'max_guests' => 'integer',
        'price_per_night' => 'decimal:2',
        'weekend_price' => 'decimal:2',
        'min_nights' => 'integer',
        'amenities' => 'array',
        'photos' => 'array',
        'is_active' => 'boolean',
        'host_years' => 'integer',
        'highlights' => 'array',
        'bedrooms_info' => 'array',
        'accessibility_features' => 'array',
        'host_is_verified' => 'boolean',
        'host_about' => 'array',
        'co_hosts' => 'array',
        'safety_property' => 'array',
        'beds' => 'integer',
        'cleaning_fee' => 'decimal:2',
        'destination_id' => 'integer',
    ];

    public function destination()
    {
        return $this->belongsTo(Destination::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function blockedDates(): HasMany
    {
        return $this->hasMany(BlockedDate::class);
    }

    public function icalLinks(): HasMany
    {
        return $this->hasMany(VillaIcalLink::class);
    }
}
