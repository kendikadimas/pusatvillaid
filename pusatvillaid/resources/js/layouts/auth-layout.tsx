import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';

export default function AuthSplitLayout({
    children,
    title = '',
    description = '',
}: {
    children: React.ReactNode;
    title?: string;
    description?: string;
}) {
    return (
        <div className="flex min-h-dvh">
            {/* Left Panel */}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-12 lg:flex">
                <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/5 blur-3xl" />

                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                <div className="relative z-10">
                    <Link href={home()} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                            <AppLogoIcon className="size-6 fill-current text-white" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight text-white">PusatVilla</span>
                    </Link>
                </div>

                <div className="relative z-10 space-y-6">
                    <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
                        Temukan villa
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-sky-200">
                            impianmu
                        </span>
                    </h2>
                    <p className="max-w-md text-base leading-relaxed text-blue-200/70">
                        Nikmati pengalaman menginap terbaik dengan pilihan villa eksklusif di destinasi wisata favorit Indonesia.
                    </p>
                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="size-8 rounded-full border-2 border-slate-800 bg-gradient-to-br from-blue-400 to-indigo-500"
                                />
                            ))}
                        </div>
                        <div className="text-sm text-blue-200/60">
                            <span className="font-semibold text-white">4.9</span> rating dari 2k+ tamu
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-blue-200/40">
                    &copy; {new Date().getFullYear()} PusatVilla. All rights reserved.
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex w-full items-center justify-center bg-white p-6 lg:w-1/2 lg:p-12">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex flex-col items-center gap-4 lg:hidden">
                        <Link href={home()} className="flex flex-col items-center gap-2 font-medium">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
                                <AppLogoIcon className="size-7 fill-current text-white" />
                            </div>
                        </Link>
                    </div>

                    <div className="mb-8 space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                            {title}
                        </h1>
                        <p className="text-balance text-sm text-slate-500">
                            {description}
                        </p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
