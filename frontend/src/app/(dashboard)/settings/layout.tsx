import SettingsLayout from '@/components/layouts/settings-layout';

export default function SettingsNestedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <SettingsLayout>{children}</SettingsLayout>;
}
