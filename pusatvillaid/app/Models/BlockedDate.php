<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockedDate extends Model
{
    use HasFactory;

    protected $fillable = [
        'villa_id',
        'date',
        'reason',
        'created_by',
        'source',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    public function scopeExternal($query)
    {
        return $query->where('source', '!=', 'manual');
    }

    public function scopeManual($query)
    {
        return $query->where('source', 'manual');
    }

    public function scopeFromPlatform($query, string $platform)
    {
        return $query->where('source', $platform);
    }

    public function villa(): BelongsTo
    {
        return $this->belongsTo(Villa::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
