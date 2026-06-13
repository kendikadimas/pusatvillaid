'use client';

import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Heading from '@/components/heading';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Button } from '@/components/ui/button';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import axiosClient from '@/lib/axios';
import AlertError from '@/components/alert-error';

export type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function ManageTwoFactor(props: Props) {
    const requiresConfirmation = props.requiresConfirmation ?? false;
    const twoFactorEnabled = props.twoFactorEnabled ?? false;

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
    const [processing, setProcessing] = useState<boolean>(false);
    const [localErrors, setLocalErrors] = useState<string[]>([]);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    const handleEnable = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setLocalErrors([]);
        try {
            await axiosClient.post('/user/two-factor-authentication');
            setShowSetupModal(true);
            await fetchSetupData();
        } catch (err: any) {
            console.error('Failed to enable 2FA:', err);
            setLocalErrors(['Failed to enable 2FA. Please confirm your password if requested.']);
        } finally {
            setProcessing(false);
        }
    };

    const handleDisable = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setLocalErrors([]);
        try {
            await axiosClient.delete('/user/two-factor-authentication');
            clearTwoFactorAuthData();
            window.location.reload();
        } catch (err: any) {
            console.error('Failed to disable 2FA:', err);
            setLocalErrors(['Failed to disable 2FA. Please confirm your password if requested.']);
        } finally {
            setProcessing(false);
        }
    };

    if (!(props.canManageTwoFactor ?? false)) {
        return null;
    }

    const activeErrors = localErrors.length > 0 ? localErrors : errors;

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Two-factor authentication"
                description="Manage your two-factor authentication settings"
            />
            {activeErrors.length > 0 && <AlertError errors={activeErrors} />}
            {twoFactorEnabled ? (
                <div className="flex flex-col items-start justify-start space-y-4">
                    <p className="text-sm text-muted-foreground">
                        You will be prompted for a secure, random pin during
                        login, which you can retrieve from the TOTP-supported
                        application on your phone.
                    </p>

                    <div className="relative inline">
                        <form onSubmit={handleDisable}>
                            <Button
                                variant="destructive"
                                type="submit"
                                disabled={processing}
                            >
                                Disable 2FA
                            </Button>
                        </form>
                    </div>

                    <TwoFactorRecoveryCodes
                        recoveryCodesList={recoveryCodesList}
                        fetchRecoveryCodes={fetchRecoveryCodes}
                        errors={errors}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-start justify-start space-y-4">
                    <p className="text-sm text-muted-foreground">
                        When you enable two-factor authentication, you will be
                        prompted for a secure pin during login. This pin can be
                        retrieved from a TOTP-supported application on your
                        phone.
                    </p>

                    <div>
                        {hasSetupData ? (
                            <Button onClick={() => setShowSetupModal(true)}>
                                <ShieldCheck />
                                Continue setup
                            </Button>
                        ) : (
                            <form onSubmit={handleEnable}>
                                <Button type="submit" disabled={processing}>
                                    Enable 2FA
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={twoFactorEnabled}
                qrCodeSvg={qrCodeSvg}
                manualSetupKey={manualSetupKey}
                clearSetupData={clearSetupData}
                fetchSetupData={fetchSetupData}
                errors={errors}
            />
        </div>
    );
}
