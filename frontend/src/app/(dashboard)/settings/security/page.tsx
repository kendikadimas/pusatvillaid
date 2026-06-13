'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ManageTwoFactor from '@/components/manage-two-factor';
import ManagePasskeys from '@/components/manage-passkeys';
import axiosClient from '@/lib/axios';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

interface SecurityData {
    canManageTwoFactor: boolean;
    canManagePasskeys: boolean;
    passkeys: any[];
    passwordRules: string;
    twoFactorEnabled?: boolean;
    requiresConfirmation?: boolean;
}

export default function SecuritySettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [securityData, setSecurityData] = useState<SecurityData | null>(null);

    // Password fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [passwordProcessing, setPasswordProcessing] = useState(false);

    const currentPasswordInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchSecurity = async () => {
            try {
                const response = await axiosClient.get('/settings/security');
                setSecurityData(response.data);
                setLoading(false);
            } catch (err: any) {
                if (err.response?.status === 423) {
                    toast.info('Please confirm your password to access security settings.');
                    router.push('/confirm-password');
                } else {
                    console.error('Failed to load security settings:', err);
                    setLoading(false);
                }
            }
        };

        fetchSecurity();
    }, [router]);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordProcessing(true);
        setPasswordErrors({});

        try {
            await axiosClient.put('/settings/password', {
                current_password: currentPassword,
                password: password,
                password_confirmation: passwordConfirmation,
            });
            setCurrentPassword('');
            setPassword('');
            setPasswordConfirmation('');
            toast.success('Password updated successfully.');
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const apiErrors: Record<string, string> = {};
                Object.keys(err.response.data.errors).forEach((key) => {
                    apiErrors[key] = err.response.data.errors[key][0];
                });
                setPasswordErrors(apiErrors);

                if (apiErrors.password) {
                    passwordInputRef.current?.focus();
                }
                if (apiErrors.current_password) {
                    currentPasswordInputRef.current?.focus();
                }
            } else if (err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error('An unexpected error occurred. Please try again.');
            }
        } finally {
            setPasswordProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    return (
        <>
            <h1 className="sr-only">Security settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Update password"
                    description="Ensure your account is using a long, random password to stay secure"
                />

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="current_password">Current password</Label>
                        <PasswordInput
                            id="current_password"
                            ref={currentPasswordInputRef}
                            name="current_password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="mt-1 block w-full"
                            autoComplete="current-password"
                            placeholder="Current password"
                        />
                        <InputError message={passwordErrors.current_password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">New password</Label>
                        <PasswordInput
                            id="password"
                            ref={passwordInputRef}
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            placeholder="New password"
                            passwordrules={securityData?.passwordRules}
                        />
                        <InputError message={passwordErrors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            placeholder="Confirm password"
                            passwordrules={securityData?.passwordRules}
                        />
                        <InputError message={passwordErrors.password_confirmation} />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            type="submit"
                            disabled={passwordProcessing}
                            data-test="update-password-button"
                            className="cursor-pointer"
                        >
                            {passwordProcessing ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>

            {securityData && (
                <>
                    <ManageTwoFactor
                        canManageTwoFactor={securityData.canManageTwoFactor}
                        requiresConfirmation={securityData.requiresConfirmation}
                        twoFactorEnabled={securityData.twoFactorEnabled}
                    />

                    <ManagePasskeys
                        canManagePasskeys={securityData.canManagePasskeys}
                        passkeys={securityData.passkeys}
                    />
                </>
            )}
        </>
    );
}
