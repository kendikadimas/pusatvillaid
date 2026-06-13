'use client';

import React, { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DeleteUser from '@/components/delete-user';
import { useAuth } from '@/context/AuthContext';
import axiosClient from '@/lib/axios';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mustVerifyEmail, setMustVerifyEmail] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [verificationProcessing, setVerificationProcessing] = useState(false);

    // Fetch initial profile settings (mustVerifyEmail, status, user)
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axiosClient.get('/settings/profile');
                setMustVerifyEmail(response.data.mustVerifyEmail);
                setStatus(response.data.status);
                if (response.data.user) {
                    setName(response.data.user.name || '');
                    setEmail(response.data.user.email || '');
                }
            } catch (err) {
                console.error('Failed to load profile settings:', err);
            }
        };

        fetchSettings();
    }, []);

    // Sync state with user context if not yet fetched/changed
    useEffect(() => {
        if (user && !name && !email) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user, name, email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            await axiosClient.patch('/settings/profile', {
                name,
                email,
            });
            await refreshUser();
            toast.success('Profile updated successfully.');
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const apiErrors: Record<string, string> = {};
                Object.keys(err.response.data.errors).forEach((key) => {
                    apiErrors[key] = err.response.data.errors[key][0];
                });
                setErrors(apiErrors);
            } else if (err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error('An unexpected error occurred. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleResendVerification = async (e: React.MouseEvent) => {
        e.preventDefault();
        setVerificationProcessing(true);
        try {
            await axiosClient.post('/email/verification-notification');
            setStatus('verification-link-sent');
            toast.success('Verification link sent.');
        } catch (err: any) {
            toast.error('Failed to resend verification email.');
        } finally {
            setVerificationProcessing(false);
        }
    };

    return (
        <>
            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            className="mt-1 block w-full"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            name="name"
                            required
                            autoComplete="name"
                            placeholder="Full name"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            className="mt-1 block w-full"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            name="email"
                            required
                            autoComplete="username"
                            placeholder="Email address"
                        />
                        <InputError message={errors.email} />
                    </div>

                    {mustVerifyEmail && user && user.email_verified_at === null && (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Your email address is unverified.{' '}
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    disabled={verificationProcessing}
                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500 cursor-pointer disabled:opacity-50"
                                >
                                    {verificationProcessing ? 'Sending...' : 'Click here to re-send the verification email.'}
                                </button>
                            </p>

                            {status === 'verification-link-sent' && (
                                <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                    A new verification link has been sent to your email address.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button
                            type="submit"
                            disabled={processing}
                            data-test="update-profile-button"
                            className="cursor-pointer"
                        >
                            {processing ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>

            <DeleteUser />
        </>
    );
}
