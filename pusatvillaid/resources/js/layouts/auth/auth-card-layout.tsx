import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-white p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="flex items-center gap-2 self-center font-medium"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                        <AppLogoIcon className="size-6 fill-current text-white" />
                    </div>
                </Link>

                <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="px-8 pt-8 pb-0 text-center">
                        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                            {title}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-500">
                            {description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 py-8">{children}</CardContent>
                </Card>
            </div>
        </div>
    );
}
