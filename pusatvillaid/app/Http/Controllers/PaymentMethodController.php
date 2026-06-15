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
        $methods = PaymentMethod::where('is_active', true)->get();

        return response()->json($methods);
    }
}
