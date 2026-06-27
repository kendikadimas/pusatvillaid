<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Cache;
use Laravel\Fortify\Features;
use Laravel\Fortify\Http\Requests\PasswordConfirmationRequiredException;
use Laravel\Fortify\InteractsWithTwoFactorState;

class TwoFactorAuthenticationRequest extends FormRequest
{
    use InteractsWithTwoFactorState;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [];
    }

    /**
     * Ensure the user's password has been recently confirmed.
     *
     * @return void
     *
     * @throws PasswordConfirmationRequiredException
     */
    public function ensureStateIsValid()
    {
        if (! Features::optionEnabled(Features::twoFactorAuthentication(), 'confirmPassword')) {
            return;
        }

        $user = $this->user();
        if (! $user) {
            throw new PasswordConfirmationRequiredException;
        }

        $confirmedAt = Cache::get('auth.password_confirmed_at.'.$user->id, 0);
        $timeout = config('auth.password_timeout', 10800);

        if (time() - $confirmedAt > $timeout) {
            throw new PasswordConfirmationRequiredException;
        }
    }
}
