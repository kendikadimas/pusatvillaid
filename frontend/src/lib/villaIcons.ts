import {
    Star, MapPin, BedDouble, Bath, Users, Calendar,
    ArrowRight, Shield, X, Check, ChevronLeft, Key,
    Waves, Trophy, Share2, Heart, Globe, Wind, Car,
    Coffee, Sparkles, Search, Tv, Wifi, Flame, Utensils,
    Briefcase, Thermometer, ShieldCheck, Languages, Dumbbell,
    CookingPot, WashingMachine, ParkingCircle, Lock, Music,
} from 'lucide-react';

export const highlightIconMap: Record<string, React.ComponentType<any>> = {
    Wind, Key, Car, Shield, Waves, Trophy, Coffee, Sparkles
};

const allIcons: Record<string, React.ComponentType<any>> = {
    Waves, Wifi, Wind, Utensils, Flame, Bath, Tv,
    Users, Heart, Coffee, Trophy, Briefcase, Shield,
    Sparkles, Thermometer, Car, Key, Star, Check, Lock,
    Dumbbell, CookingPot, WashingMachine, ParkingCircle, Music,
    ShieldCheck,
};

const fuzzyKeywords: Record<string, string[]> = {
    Waves: ['kolam', 'renang', 'pool', 'jacuzzi', 'air', 'laut', 'pantai', 'mandi'],
    Wifi: ['wifi', 'internet', 'jaringan', 'nirkabel'],
    Wind: ['ac', 'pendingin', 'kipas', 'angin', 'sejuk', 'dingin'],
    Utensils: ['dapur', 'masak', 'makan', 'minum', 'sarapan', 'prasmanan', 'restoran'],
    Flame: ['bbq', 'barbekyu', 'panggangan', 'grill', 'api', 'panas'],
    Bath: ['mandi', 'bak', 'shower', 'kamar mandi', 'handuk', 'bathtub'],
    Tv: ['tv', 'televisi', 'smart tv', 'netflix', 'layar', 'bioskop'],
    Users: ['butler', 'pelayan', 'staf', 'asisten', 'layanan', 'resepsionis'],
    Heart: ['spa', 'pijat', 'relaksasi', 'wellness', 'kebugaran', 'yoga'],
    Coffee: ['kopi', 'teh', 'minuman', 'sarapan terapung', 'floating breakfast'],
    Briefcase: ['bawaan', 'tas', 'koper', 'bagasi', 'titip'],
    Car: ['parkir', 'mobil', 'kendaraan', 'garasi', 'motor'],
    Lock: ['kunci', 'brankas', 'keamanan', 'safe', 'deposit box'],
    Dumbbell: ['gym', 'fitness', 'olahraga', 'angkat beban', 'treadmill'],
    CookingPot: ['kompor', 'rice cooker', 'alat masak', 'blender', 'microwave', 'oven'],
    WashingMachine: ['cuci', 'laundry', 'mesin cuci', 'jemur', 'pengering', 'setrika'],
    ParkingCircle: ['parkir', 'valet', 'mobil listrik', 'ev charging'],
    Music: ['karaoke', 'speaker', 'sound', 'musik', 'audio', 'home theater'],
    Shield: ['alarm', 'detektor', 'kamera', 'pemadam', 'keamanan', 'carbon monoxide'],
    Sparkles: ['sabun', 'sampo', 'perlengkapan mandi', 'toiletries', 'kosmetik'],
    Thermometer: ['air panas', 'water heater', 'pemanas', 'hangat'],
    ShieldCheck: ['asuransi', 'garansi', 'jaminan', 'refund'],
    Star: ['bintang', 'premium', 'mewah', 'luxury', 'eksklusif'],
    Key: ['check-in mandiri', 'self check-in', 'smart lock', 'kunci pintar'],
};

export function getAmenityIcon(nameOrObj: string): React.ComponentType<any> {
    const name = nameOrObj.toLowerCase();
    if (amenityIconMap[nameOrObj]) return amenityIconMap[nameOrObj];

    let bestIcon: React.ComponentType<any> | null = null;
    let bestScore = 0;
    for (const [iconKey, keywords] of Object.entries(fuzzyKeywords)) {
        for (const kw of keywords) {
            if (name.includes(kw)) {
                const score = kw.length;
                if (score > bestScore) {
                    bestScore = score;
                    bestIcon = allIcons[iconKey];
                }
            }
        }
    }
    return bestIcon ?? Check;
}

const amenityIconMap: Record<string, React.ComponentType<any>> = {
    'Kolam Renang': Waves,
    'WiFi': Wifi,
    'AC': Wind,
    'Dapur Lengkap': Utensils,
    'Dapur': Utensils,
    'BBQ Area': Flame,
    'Water Heater': Bath,
    'Smart TV': Tv,
    'TV': Tv,
    'Bak mandi': Bath,
    'Private Jacuzzi': Waves,
    'Butler Service': Users,
    'Spa Room': Heart,
    'Floating Breakfast': Coffee,
    'Karaoke': Trophy,
    'Diizinkan menitipkan bawaan': Briefcase,
    'Kamera keamanan di bagian luar di properti': Shield,
    'Alarm karbon monoksida': Shield,
    'Alarm asap': Shield,
    'Sampo': Sparkles,
    'Sabun mandi': Sparkles,
    'Air panas': Thermometer,
    'Sabun mandi cair': Sparkles,
};

export interface IconCatalogItem {
    key: string;
    label: string;
    component: React.ComponentType<any>;
}

export const iconCatalog: IconCatalogItem[] = [
    { key: 'Waves', label: 'Kolam / Air', component: Waves },
    { key: 'Wifi', label: 'WiFi', component: Wifi },
    { key: 'Wind', label: 'AC / Kipas', component: Wind },
    { key: 'Utensils', label: 'Dapur / Makan', component: Utensils },
    { key: 'Flame', label: 'BBQ / Grill', component: Flame },
    { key: 'Bath', label: 'Bak Mandi / Shower', component: Bath },
    { key: 'Tv', label: 'TV', component: Tv },
    { key: 'Users', label: 'Pelayan / Butle', component: Users },
    { key: 'Heart', label: 'Spa / Wellness', component: Heart },
    { key: 'Coffee', label: 'Sarapan / Kopi', component: Coffee },
    { key: 'Briefcase', label: 'Bawaan / Tas', component: Briefcase },
    { key: 'Car', label: 'Parkir / Mobil', component: Car },
    { key: 'Lock', label: 'Brankas / Kunci', component: Lock },
    { key: 'Dumbbell', label: 'Gym / Fitness', component: Dumbbell },
    { key: 'CookingPot', label: 'Alat Masak', component: CookingPot },
    { key: 'WashingMachine', label: 'Laundry / Cuci', component: WashingMachine },
    { key: 'ParkingCircle', label: 'Valet / EV Charging', component: ParkingCircle },
    { key: 'Music', label: 'Karaoke / Musik', component: Music },
    { key: 'Shield', label: 'Keamanan', component: Shield },
    { key: 'Sparkles', label: 'Perlengkapan Mandi', component: Sparkles },
    { key: 'Thermometer', label: 'Air Panas', component: Thermometer },
    { key: 'ShieldCheck', label: 'Asuransi / Garansi', component: ShieldCheck },
    { key: 'Star', label: 'Bintang / Premium', component: Star },
    { key: 'Key', label: 'Check-in Mandiri', component: Key },
    { key: 'Check', label: 'Lainnya', component: Check },
];

export function getIconComponentByKey(key: string): React.ComponentType<any> {
    const found = iconCatalog.find(i => i.key === key);
    return found?.component ?? Check;
}

export function getHostAboutIcon(text: string, index: number): React.ComponentType<any> {
    const t = text.toLowerCase();
    if (t.includes('lahir') || t.includes('tahun')) return Sparkles;
    if (t.includes('sekolah') || t.includes('kuliah') || t.includes('universitas') || t.includes('rmit') || t.includes('kerja')) return Briefcase;
    if (t.includes('bahasa')) return Languages;
    if (t.includes('hobi') || t.includes('suka') || t.includes('cinta')) return Heart;
    return index % 2 === 0 ? Sparkles : Globe;
}
