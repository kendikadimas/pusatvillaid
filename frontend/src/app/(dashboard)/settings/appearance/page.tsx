'use client';

import AppearanceToggleTab from '@/components/appearance-tabs';
import Heading from '@/components/heading';

export default function AppearanceSettingsPage() {
    return (
        <>
            <h1 className="sr-only">Appearance settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Appearance settings"
                    description="This application always uses light mode"
                />
                <AppearanceToggleTab />
            </div>
        </>
    );
}
