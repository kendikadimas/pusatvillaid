'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import AuthLayout from '@/components/auth-layout';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import axiosClient from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

const OTP_MAX_LENGTH = 6;

export default function TwoFactorChallengePage() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');
    const [recoveryCode, setRecoveryCode] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const authConfigContent = useMemo(() => {
        if (showRecoveryInput) {
            return {
                title: 'Recovery code',
                description:
                    'Please confirm access to your account by entering one of your emergency recovery codes.',
                toggleText: 'login using an authentication code',
            };
        }

        return {
            title: 'Authentication code',
            description:
                'Enter the authentication code provided by your authenticator application.',
            toggleText: 'login using a recovery code',
        };
    }, [showRecoveryInput]);

    const toggleRecoveryMode = () => {
        setShowRecoveryInput(!showRecoveryInput);
        setErrors({});
        setCode('');
        setRecoveryCode('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const payload = showRecoveryInput 
                ? { recovery_code: recoveryCode }
                : { code };

            await axiosClient.post('/two-factor-challenge', payload);
            await refreshUser();
            router.push('/dashboard');
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const apiErrors: Record<string, string> = {};
                Object.keys(err.response.data.errors).forEach((key) => {
                    apiErrors[key] = err.response.data.errors[key][0];
                });
                setErrors(apiErrors);
            } else if (err.response?.data?.message) {
                const errorKey = showRecoveryInput ? 'recovery_code' : 'code';
                setErrors({ [errorKey]: err.response.data.message });
            } else {
                const errorKey = showRecoveryInput ? 'recovery_code' : 'code';
                setErrors({ [errorKey]: 'Invalid authentication details.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AuthLayout
            title={authConfigContent.title}
            description={authConfigContent.description}
        >
            <div className="flex flex-col gap-5">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {showRecoveryInput ? (
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium text-[#111111] dark:text-slate-200">
                                Recovery code
                            </label>
                            <Input
                                name="recovery_code"
                                type="text"
                                placeholder="Enter recovery code"
                                value={recoveryCode}
                                onChange={(e) => setRecoveryCode(e.target.value)}
                                autoFocus={showRecoveryInput}
                                required
                                className="h-10 rounded-lg border-slate-200 bg-white transition-all duration-200 placeholder:text-[#787774] focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
                            />
                            <InputError message={errors.recovery_code} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                            <label className="text-sm font-medium text-[#111111] dark:text-slate-200">
                                Authentication code
                            </label>
                            <div className="flex w-full items-center justify-center">
                                <InputOTP
                                    name="code"
                                    maxLength={OTP_MAX_LENGTH}
                                    value={code}
                                    onChange={(value) => setCode(value)}
                                    disabled={processing}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    autoFocus
                                    containerClassName="gap-3"
                                >
                                    <InputOTPGroup>
                                        {Array.from(
                                            { length: OTP_MAX_LENGTH },
                                            (_, index) => (
                                                <InputOTPSlot
                                                    key={index}
                                                    index={index}
                                                    className="size-11 rounded-lg border-slate-200 text-lg font-semibold shadow-sm transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-slate-700"
                                                />
                                            ),
                                        )}
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            <InputError message={errors.code} />
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="mt-2 h-11 w-full cursor-pointer rounded-lg bg-green-600 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-700 active:scale-[0.98] disabled:opacity-60"
                        disabled={processing}
                    >
                        {processing && <Spinner className="mr-2" />}
                        {processing ? 'Verifying...' : 'Continue'}
                    </Button>

                    <div className="text-center text-sm text-[#787774] dark:text-slate-400">
                        <span>Or </span>
                        <button
                            type="button"
                            className="font-semibold text-green-600 underline decoration-green-200 underline-offset-4 transition-colors duration-200 hover:text-green-700 hover:decoration-green-300 dark:text-green-400 dark:hover:text-green-300"
                            onClick={toggleRecoveryMode}
                        >
                            {authConfigContent.toggleText}
                        </button>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}
