<?php

namespace App\Http\Controllers;

use App\Models\Destination;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class DestinationController extends Controller
{
    public function index(): JsonResponse
    {
        $destinations = Cache::remember('destinations_all', 300, function () {
            return Destination::all()->toArray();
        });

        return response()->json([
            'data' => array_values($destinations),
        ]);
    }
}
