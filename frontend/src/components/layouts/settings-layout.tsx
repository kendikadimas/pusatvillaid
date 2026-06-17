'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import PublicHeader from '@/components/PublicHeader';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const sidebarNavItems = [
    {
        title: 'Profile',
        href: '/settings/profile',
    },
    {
        title: 'Security',
        href: '/settings/security',
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-white">
            <PublicHeader />

            <div className="max-w-8xl mx-auto px-4 sm:px-14 lg:px-24 py-6">
                <Heading
                    title="Settings"
                    description="Manage your profile and account settings"
                />

                <div className="flex flex-col lg:flex-row lg:space-x-12">
                    <aside className="w-full max-w-xl lg:w-48">
                        <nav
                            className="flex flex-col space-y-1 space-x-0"
                            aria-label="Settings"
                        >
                            {sidebarNavItems.map((item, index) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Button
                                        key={`${item.href}-${index}`}
                                        size="sm"
                                        variant="ghost"
                                        asChild
                                        className={cn('w-full justify-start cursor-pointer', {
                                            'bg-muted font-medium text-foreground': isActive,
                                        })}
                                    >
                                        <Link href={item.href}>
                                            {item.title}
                                        </Link>
                                    </Button>
                                );
                            })}
                        </nav>
                    </aside>

                    <Separator className="my-6 lg:hidden" />

                    <div className="flex-1 md:max-w-2xl">
                        <section className="max-w-xl space-y-12">
                            {children}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

