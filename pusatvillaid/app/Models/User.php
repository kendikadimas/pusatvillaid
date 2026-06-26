<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * All available permission slugs for limited admin accounts.
     * super_admin implicitly has all of these.
     */
    public const PERMISSIONS = [
        'bookings.view',
        'bookings.manage',
        'villas.view',
        'villas.manage',
        'reviews.view',
        'reviews.manage',
        'destinations.view',
        'destinations.manage',
        'payment_methods.view',
        'payment_methods.manage',
        'analytics.view',
        'settings.view',
        'settings.manage',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'google_id',
        'avatar',
        'password',
        'permissions',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'permissions' => 'array',
        ];
    }

    /**
     * Check if the user is a super admin (unrestricted access).
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Check if the user has any admin role (admin or super_admin).
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'super_admin']);
    }

    /**
     * Check if the user has a specific permission.
     * super_admin always returns true.
     * admin returns true only if the slug is in their permissions array.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return in_array($permission, $this->permissions ?? []);
    }

    /**
     * Get effective permissions for this user.
     * super_admin gets all permissions, admin gets their assigned subset.
     */
    public function getAllPermissions(): array
    {
        if ($this->isSuperAdmin()) {
            return self::PERMISSIONS;
        }

        return $this->permissions ?? [];
    }
}
