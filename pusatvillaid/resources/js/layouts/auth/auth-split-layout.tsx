import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative grid min-h-dvh flex-col lg:grid-cols-2">
            {/* ── Left Brand Panel ── */}
            <div className="relative hidden h-full min-h-dvh flex-col overflow-hidden lg:flex">
                {/* Background gradient layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.06)_0%,_transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(37,99,235,0.15)_0%,_transparent_50%)]" />

                {/* Decorative grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                    }}
                />

                {/* Floating decorative circles */}
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full from-blue-400/10 blur-3xl" />
                <div className="absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-blue-400/5 blur-2xl" />

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col p-10">
                    {/* Logo */}
                    <Link
                        href={home()}
                        className="flex items-center gap-3 text-white"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                            <AppLogoIcon className="size-6 fill-current text-white" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight">
                            PusatVilla.id
                        </span>
                    </Link>

                    {/* Center messaging */}
                    <div className="mt-auto mb-auto flex flex-col gap-6">
                        <div className="space-y-3">
                            <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
                                Experience the
                                <br />
                                <span className="bg-gradient-to-r from-blue-300 to-blue-200 bg-clip-text text-transparent">
                                    finest villas
                                </span>
                                <br />
                                across Indonesia
                            </h2>
                            <p className="max-w-md text-base leading-relaxed text-white/60">
                                Curated luxury villas in Bali, Lombok, Yogyakarta,
                                and beyond. Your gateway to unforgettable stays.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-10">
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    500+
                                </div>
                                <div className="text-sm text-white/50">
                                    Premium Villas
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    50K+
                                </div>
                                <div className="text-sm text-white/50">
                                    Happy Guests
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    4.9
                                </div>
                                <div className="text-sm text-white/50">
                                    Guest Rating
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom quote */}
                    <div className="border-t border-white/10 pt-6">
                        <p className="text-sm italic text-white/40">
                            "The most beautiful villas in Indonesia, all in one place."
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="relative flex min-h-dvh items-center justify-center bg-white p-6 lg:p-10">
                {/* Mobile logo */}
                <Link
                    href={home()}
                    className="absolute top-6 left-6 flex items-center gap-2 lg:hidden"
                >
                    <AppLogoIcon className="size-8 fill-current text-blue-600" />
                    <span className="text-sm font-semibold tracking-tight text-slate-900">
                        PusatVilla.id
                    </span>
                </Link>

                <div className="mx-auto w-full max-w-sm">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="mb-8 flex flex-col gap-2 text-left">
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                                {title}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {description}
                            </p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
