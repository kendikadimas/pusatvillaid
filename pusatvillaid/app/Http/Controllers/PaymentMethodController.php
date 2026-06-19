<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;

class PaymentMethodController extends Controller
{
    /**
     * Display a listing of the active payment methods.
     */
    public function indexPublic(): JsonResponse
    {
        // Auto-create QRIS if not exists
        $qris = PaymentMethod::where('code', 'qris')->first();
        if (! $qris) {
            PaymentMethod::create([
                'name' => 'QRIS',
                'code' => 'qris',
                'account_number' => '',
                'account_name' => 'PusatVilla Indonesia',
                'is_active' => true,
            ]);
        }

        $methods = PaymentMethod::where('is_active', true)->get();

        return response()->json($methods);
    }
}
