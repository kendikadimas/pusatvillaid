import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700">
                    A new verification link has been sent to your email.
                </div>
            )}

            <Form {...send.form()}>
                {({ processing }) => (
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                                <svg
                                    className="h-8 w-8 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm sm:text-base text-slate-500">
                                Click the link in the email we sent you to
                                verify your account.
                            </p>
                        </div>

                        <Button
                            disabled={processing}
                            className="h-11 w-full rounded-lg bg-blue-600 text-base font-semibold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
                        >
                            {processing && <Spinner className="mr-2" />}
                            {processing
                                ? 'Sending...'
                                : 'Resend verification email'}
                        </Button>

                        <TextLink
                            href={logout()}
                            className="text-sm font-medium text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-700 hover:decoration-blue-400"
                        >
                            Log out
                        </TextLink>
                    </div>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Check your inbox',
    description:
        'We sent you a verification link. Please check your email to continue.',
};
