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
        $methods = PaymentMethod::where('is_active', true)
            ->select(['id', 'name', 'code', 'account_number', 'account_name', 'logo_url', 'admin_fee'])
            ->get();

        return response()->json($methods);
    }
}
