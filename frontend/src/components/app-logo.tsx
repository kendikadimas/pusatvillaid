import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center space-x-1.5 group shrink-0">
            <AppLogoIcon className="w-8 h-8 text-green-500 fill-current" />
            <span className="text-xl font-sans font-black tracking-tight text-green-500">
                pusatvilla.id
            </span>
        </div>
    );
}
