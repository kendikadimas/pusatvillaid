<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingAdminController extends Controller
{
    /**
     * Get all settings.
     */
    public function index(): JsonResponse
    {
        $settings = [
            'settings_prop_name' => Setting::getValue('settings_prop_name', 'PusatVilla.id'),
            'settings_website' => Setting::getValue('settings_website', 'https://pusatvillaid.com'),
            'settings_wa' => Setting::getValue('settings_wa', '081234567890'),
            'settings_email' => Setting::getValue('settings_email', 'noreply@pusatvilla.id'),
            'settings_address' => Setting::getValue('settings_address', 'Cisarua, Puncak, Bogor, Jawa Barat'),
            'settings_checkin' => Setting::getValue('settings_checkin', '14:00'),
            'settings_checkout' => Setting::getValue('settings_checkout', '12:00'),
            'settings_midtrans' => Setting::getValue('settings_midtrans', 'sandbox'),
            'tax_percentage' => (int) Setting::getValue('tax_percentage', 0),
        ];

        return response()->json($settings);
    }

    /**
     * Update settings.
     */
    public function update(Request $request): JsonResponse
    {
        $rules = [
            'settings_prop_name' => 'required|string|max:255',
            'settings_website' => 'required|string|max:255',
            'settings_wa' => 'required|string|max:50',
            'settings_email' => 'required|email|max:255',
            'settings_address' => 'required|string|max:1000',
            'settings_checkin' => 'required|string|max:5',
            'settings_checkout' => 'required|string|max:5',
            'settings_midtrans' => 'sometimes|string|in:sandbox,production',
            'tax_percentage' => 'required|integer|min:0|max:100',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        foreach ($rules as $key => $rule) {
            if ($request->has($key)) {
                Setting::setValue($key, $request->input($key));
            }
        }

        return response()->json(['message' => 'Pengaturan berhasil disimpan.']);
    }
}
