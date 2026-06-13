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
            <div className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {showRecoveryInput ? (
                        <>
                            <Input
                                name="recovery_code"
                                type="text"
                                placeholder="Enter recovery code"
                                value={recoveryCode}
                                onChange={(e) => setRecoveryCode(e.target.value)}
                                autoFocus={showRecoveryInput}
                                required
                            />
                            <InputError message={errors.recovery_code} />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-3 text-center">
                            <div className="flex w-full items-center justify-center">
                                <InputOTP
                                    name="code"
                                    maxLength={OTP_MAX_LENGTH}
                                    value={code}
                                    onChange={(value) => setCode(value)}
                                    disabled={processing}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    autoFocus
                                >
                                    <InputOTPGroup>
                                        {Array.from(
                                            { length: OTP_MAX_LENGTH },
                                            (_, index) => (
                                                <InputOTPSlot
                                                    key={index}
                                                    index={index}
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
                        className="w-full cursor-pointer"
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Continue
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        <span>or you can </span>
                        <button
                            type="button"
                            className="cursor-pointer text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current"
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
