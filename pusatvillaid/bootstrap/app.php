<?php

use App\Http\Middleware\AdminMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'password.confirm' => \App\Http\Middleware\RequirePasswordCustom::class,
        ]);

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Disable stateful API - using Bearer token auth instead of session cookies
        // $middleware->statefulApi();

        $middleware->validateCsrfTokens(except: [
            'auth/google/callback',
            'api/*',
            'login',
            'register',
            'logout',
            'forgot-password',
            'reset-password',
            'email/verification-notification',
            'user/confirm-password',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
