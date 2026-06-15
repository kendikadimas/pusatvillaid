<?php

namespace App\Http\Controllers;

use App\Models\Destination;
use Illuminate\Http\JsonResponse;

class DestinationController extends Controller
{
    public function index(): JsonResponse
    {
        $destinations = Destination::all();

        return response()->json([
            'data' => $destinations,
        ]);
    }
}
