'use client';

import type { ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { KeyRound } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';

type UrlMethodPair = {
    url: string;
    method: string;
};

type Props = {
    routes?: {
        options: UrlMethodPair;
        submit: UrlMethodPair;
    };
    label?: string;
    loadingLabel?: string;
    separator?: string;
    showSeparator?: boolean;
};

export default function PasskeyVerify({
    routes,
    label,
    loadingLabel,
    separator,
    showSeparator = true,
}: Props = {}) {
    const router = useRouter();

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    const { verify, isLoading, error, isSupported } = usePasskeyVerify({
        routes: {
            options: routes?.options.url || `${backendUrl}/passkeys/login/options`,
            submit: routes?.submit.url || `${backendUrl}/passkeys/login`,
        },
        onSuccess: (response) => {
            router.push(response.redirect ?? '/dashboard');
        },
    });

    if (!isSupported) {
        return null;
    }

    return (
        <>
            <div className="grid gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full cursor-pointer rounded-lg border-green-200 bg-white text-green-600 shadow-sm transition-all duration-200 hover:bg-green-50 hover:text-green-700 active:scale-[0.98] dark:border-green-800 dark:bg-slate-800 dark:text-green-400 dark:hover:bg-green-900 dark:hover:text-green-100"
                    onClick={verify}
                    disabled={isLoading}
                >
                    {isLoading ? <Spinner /> : <KeyRound className="h-4 w-4" />}
                    {isLoading
                        ? (loadingLabel ?? 'Authenticating...')
                        : (label ?? 'Sign in with a passkey')}
                </Button>
                {error && (
                    <InputError message={error} className="text-center" />
                )}
            </div>

            {showSeparator && (
                <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wide">
                        <span className="bg-white px-3 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                            {separator ?? 'Or continue with email'}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
}
