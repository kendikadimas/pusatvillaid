import Link from 'next/link';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AuthLayout({
    children,
    title,
    description,
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex min-h-dvh font-sans bg-slate-50">
            {/* Left Panel - Brand/Image with real luxury villa background */}
            <div 
                className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex bg-cover bg-center"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80')` }}
            >
                {/* Dark glassmorphic backdrop for contrast */}
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]" />
                <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm transition-transform active:scale-95">
                            <AppLogoIcon className="size-6 fill-current text-white" />
                        </div>
                        <span className="text-xl font-sans font-black tracking-tight text-white">pusatvilla.id</span>
                    </Link>
                </div>

                <div className="relative z-10 space-y-6">
                    <h2 className="font-serif text-4xl md:text-5xl font-medium leading-tight tracking-tight text-white">
                        Temukan villa
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-sky-200">
                            impianmu
                        </span>
                    </h2>
                    <p className="max-w-md text-base leading-relaxed text-slate-200/90 font-medium">
                        Nikmati pengalaman menginap terbaik dengan pilihan villa eksklusif di destinasi wisata favorit Indonesia.
                    </p>
                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex -space-x-2.5">
                            {[
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
                                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
                                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
                                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80'
                            ].map((url, i) => (
                                <div
                                    key={i}
                                    className="size-8 rounded-full border-2 border-slate-900 bg-cover bg-center shadow-md"
                                    style={{ backgroundImage: `url(${url})` }}
                                />
                            ))}
                        </div>
                        <div className="text-xs text-slate-200 font-semibold bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-xs">
                            <span className="font-black text-amber-300">★ 4.9</span> rating dari 2k+ tamu
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-xs text-slate-400 font-medium">
                    &copy; {new Date().getFullYear()} PusatVilla.id. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Form with clean white minimalist design */}
            <div className="flex w-full items-center justify-center bg-white p-6 lg:w-1/2 lg:p-12">
                <div className="w-full max-w-sm space-y-8">
                    <div className="flex flex-col items-center gap-4 lg:hidden">
                        <Link href="/" className="flex flex-col items-center gap-2 font-medium">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/10">
                                <AppLogoIcon className="size-7 fill-current text-white" />
                            </div>
                            <span className="text-lg font-sans font-black tracking-tight text-blue-600 mt-1">pusatvilla.id</span>
                        </Link>
                    </div>

                    <div className="space-y-2.5">
                        <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight text-[#0d0d0d]">
                            {title}
                        </h1>
                        <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
