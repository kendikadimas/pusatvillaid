import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot password" />

            {status && (
                <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700">
                    {status}
                </div>
            )}

            <div className="flex flex-col gap-5">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <div className="flex flex-col gap-5">
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="email"
                                    className="text-sm sm:text-base font-medium text-slate-700"
                                >
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                    className="h-10 rounded-lg border-slate-300 bg-white transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <Button
                                className="mt-2 h-11 w-full rounded-lg bg-blue-600 text-base font-semibold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing && (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {processing
                                    ? 'Sending link...'
                                    : 'Send reset link'}
                            </Button>
                        </div>
                    )}
                </Form>

                <div className="mt-2 text-center text-sm text-slate-500">
                    Or, return to{' '}
                    <TextLink
                        href={login()}
                        className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                        log in
                    </TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: "No worries — we'll send you a reset link",
};
