import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirm password" />

            <div className="flex flex-col gap-5">
                <Form {...store.form()} resetOnSuccess={['password']}>
                    {({ processing, errors }) => (
                        <div className="flex flex-col gap-5">
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="password"
                                    className="text-sm sm:text-base font-medium text-slate-700"
                                >
                                    Password
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    autoFocus
                                    inputClassName="h-10 rounded-lg border-slate-300 bg-white transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <Button
                                className="mt-2 h-11 w-full rounded-lg bg-blue-600 text-base font-semibold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing && <Spinner className="mr-2" />}
                                {processing
                                    ? 'Confirming...'
                                    : 'Confirm password'}
                            </Button>
                        </div>
                    )}
                </Form>
            </div>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirm password',
    description:
        'This is a secure area. Please confirm your password before continuing.',
};
