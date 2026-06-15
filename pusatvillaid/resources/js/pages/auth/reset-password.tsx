import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="flex flex-col gap-5">
                        <div className="grid gap-1.5">
                                <Label
                                    htmlFor="email"
                                    className="text-sm sm:text-base font-medium text-slate-700"
                                >
                                    Email
                            </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    className="h-10 rounded-lg border-slate-300 bg-white transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    readOnly
                                />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-1.5">
                                <Label
                                    htmlFor="password"
                                    className="text-sm sm:text-base font-medium text-slate-700"
                                >
                                    New password
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                autoFocus
                                placeholder="Create a new password"
                                passwordrules={passwordRules}
                                    inputClassName="h-10 rounded-lg border-slate-300 bg-white transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-1.5">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="text-sm sm:text-base font-medium text-slate-700"
                                >
                                    Confirm new password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                placeholder="Repeat your new password"
                                passwordrules={passwordRules}
                                    inputClassName="h-10 rounded-lg border-slate-300 bg-white transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-2 h-11 w-full rounded-lg bg-blue-600 text-base font-semibold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner className="mr-2" />}
                            {processing ? 'Resetting...' : 'Reset password'}
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Set new password',
    description: 'Choose a strong password you haven\'t used before',
};
