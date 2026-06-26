<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    /**
     * Get public settings.
     */
    public function indexPublic(): JsonResponse
    {
        $settings = [
            'settings_prop_name' => Setting::getValue('settings_prop_name', 'PusatVilla.id'),
            'settings_website' => Setting::getValue('settings_website', 'https://pusatvillaid.com'),
            'settings_wa' => Setting::getValue('settings_wa', '081234567890'),
            'settings_email' => Setting::getValue('settings_email', 'noreply@pusatvilla.id'),
            'settings_address' => Setting::getValue('settings_address', 'Cisarua, Puncak, Bogor, Jawa Barat'),
            'settings_checkin' => Setting::getValue('settings_checkin', '14:00'),
            'settings_checkout' => Setting::getValue('settings_checkout', '12:00'),
            'tax_percentage' => (int) Setting::getValue('tax_percentage', 0),
        ];

        return response()->json($settings);
    }
}
