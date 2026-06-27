<?php

namespace Database\Seeders;

use App\Models\BlockedDate;
use App\Models\Booking;
use App\Models\Destination;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Review;
use App\Models\User;
use App\Models\Villa;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Admin User
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin PusatVilla',
                'password' => bcrypt('password'), // default password
                'role' => 'admin',
            ]
        );

        // 2. Create Regular Test User
        $user = User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'User PusatVilla',
                'password' => bcrypt('password'), // default password
                'role' => 'user',
            ]
        );

        // Seed Destinations
        $destinations = [
            [
                'name' => 'Puncak, Bogor',
                'city' => 'Puncak, Bogor',
                'query' => 'Bogor',
                'image' => 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
                'count_fallback' => '12+ Villa',
            ],
            [
                'name' => 'Ubud, Gianyar',
                'city' => 'Ubud, Gianyar',
                'query' => 'Ubud',
                'image' => 'https://images.unsplash.com/photo-1549638441-b787d2e11f14?auto=format&fit=crop&w=600&q=80',
                'count_fallback' => '8+ Villa',
            ],
            [
                'name' => 'Seminyak, Bali',
                'city' => 'Seminyak, Bali',
                'query' => 'Bali',
                'image' => 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=600&q=80',
                'count_fallback' => '15+ Villa',
            ],
            [
                'name' => 'Dago, Bandung',
                'city' => 'Dago, Bandung',
                'query' => 'Bandung',
                'image' => 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=600&q=80',
                'count_fallback' => '6+ Villa',
            ],
            [
                'name' => 'Batu, Malang',
                'city' => 'Batu, Malang',
                'query' => 'Malang',
                'image' => 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
                'count_fallback' => '9+ Villa',
            ],
            [
                'name' => 'Senggigi, Lombok',
                'city' => 'Senggigi, Lombok',
                'query' => 'Lombok',
                'image' => 'https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&w=600&q=80',
                'count_fallback' => '5+ Villa',
            ],
        ];

        foreach ($destinations as $dest) {
            Destination::firstOrCreate(['query' => $dest['query']], $dest);
        }

        // 2. Create Villas
        $villasData = [
            [
                'name' => 'PULAS Private Villa Prawiro oleh Fulton',
                'slug' => 'pulas-private-villa-prawiro-oleh-fulton',
                'description' => 'Perpaduan unik antara desain klasik dan modern, terletak di pusat distrik pariwisata Yogyakarta yang semarak. Hanya satu menit dari jalan Prawirotaman dan 10 menit dari malioboro dengan kendaraan. Nikmati masa inap santai di vila minimalis kami, lengkap dengan kolam renang pribadi, sangat cocok untuk bersantai dan menikmati budaya lokal.',
                'short_desc' => 'Vila minimalis dengan kolam renang pribadi di dekat Prawirotaman Yogyakarta.',
                'location' => 'Mergangsan, Yogyakarta, Indonesia',
                'maps_url' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.7567784013444!2d110.3707788!3d-7.8155986!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a57a17df986d3%3A0xe54d3ee18a0b0d36!2sJl.%20Prawirotaman%2C%20Mergangsan%2C%20Kota%20Yogyakarta%2C%20Daerah%20Istimewa%20Yogyakarta!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid',
                'bedrooms' => 1,
                'bathrooms' => 1,
                'max_guests' => 2,
                'price_per_night' => 1145139.00,
                'weekend_price' => 1145139.00,
                'min_nights' => 1,
                'amenities' => ['Dapur', 'WiFi', 'Kolam Renang', 'TV', 'AC', 'Bak mandi', 'Diizinkan menitipkan bawaan', 'Kamera keamanan di bagian luar di properti', 'Alarm karbon monoksida', 'Alarm asap', 'Sampo', 'Sabun mandi', 'Air panas', 'Sabun mandi cair'],
                'photos' => [
                    'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: setelah pukul 14:00 WIB\nCheck-out: sebelum pukul 12:00 WIB\nDilarang merokok di dalam kamar\nDilarang membawa hewan peliharaan\nJam tenang mulai pukul 22:00 WIB",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
                'host_name' => 'Bobby',
                'host_years' => 2,
                'host_avatar' => 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
                'host_joined_label' => 'Mulai menerima tamu tahun 2024',
                'host_is_verified' => true,
                'host_about' => ['Lahir di tahun 80-an', 'Tempat saya bersekolah: RMIT University'],
                'co_hosts' => [
                    ['name' => 'Lita', 'avatar' => 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'],
                    ['name' => 'Gabriel', 'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'],
                    ['name' => 'Fulton Villa', 'avatar' => 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80'],
                ],
                'cancellation_policy' => 'Pembatalan gratis selama 24 jam. Setelahnya, biaya reservasi tidak dapat dikembalikan. Baca kebijakan lengkap tuan rumah untuk rincian selengkapnya.',
                'safety_property' => [
                    'Alarm karbon monoksida tidak dilaporkan',
                    'Alarm asap tidak dilaporkan',
                    'Kamera keamanan di bagian luar properti',
                ],
                'neighborhood_desc' => 'Terletak di pusat distrik pariwisata Yogyakarta, di mana Anda bisa berjalan-jalan untuk menemukan restoran lokal, Asia, dan Barat serta berbelanja di butik-butik yang menyenangkan.',
                'highlights' => [
                    ['icon' => 'Waves', 'title' => 'Tunggu apa lagi?', 'description' => 'Ini salah satu dari sedikit tempat di area ini yang menyediakan kolam renang.'],
                    ['icon' => 'Wind', 'title' => 'Dirancang agar tetap sejuk', 'description' => 'Atasi hawa panas dengan AC dan kipas angin gantung.'],
                    ['icon' => 'Key', 'title' => 'Pengalaman check-in sangat baik', 'description' => 'Tamu terakhir menyukai awal yang mulus untuk masa inap ini.'],
                ],
                'bedrooms_info' => [
                    ['image' => 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80', 'title' => 'Kamar tidur 1', 'subtext' => '1 tempat tidur king'],
                ],
                'accessibility_features' => [],
            ],
            [
                'name' => 'Ubud Sanctuary Pool Villa',
                'slug' => 'ubud-sanctuary-pool-villa',
                'description' => "Tersembunyi di rimbunnya hutan tropis Ubud, villa ini menawarkan kedamaian mutlak dan privasi tinggi. Menampilkan kolam renang infinity tepi tebing, arsitektur tradisional Bali yang mewah, dan layanan butler pribadi.\n\nSangat cocok untuk bulan madu atau liburan relaksasi premium Anda di Bali.",
                'short_desc' => 'Luxury pool villa romantis dengan infinity pool menghadap tebing hutan Ubud.',
                'location' => 'Sayan, Ubud, Gianyar, Bali',
                'maps_url' => 'https://maps.google.com/?q=Ubud',
                'bedrooms' => 1,
                'bathrooms' => 1,
                'max_guests' => 2,
                'price_per_night' => 4500000.00,
                'weekend_price' => 4500000.00,
                'min_nights' => 2,
                'amenities' => ['Kolam Renang', 'WiFi', 'AC', 'Dapur Lengkap', 'Water Heater', 'Butler Service', 'Spa Room', 'Floating Breakfast'],
                'photos' => [
                    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: setelah pukul 14:00 WITA\nCheck-out: sebelum pukul 12:00 WITA\nDilarang berteriak atau berisik yang mengganggu satwa liar sekitar\nDilarang merokok di dalam kamar",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            // === BOGOR VILLAS ===
            [
                'name' => 'Villa Kencana Cilember',
                'slug' => 'villa-kencana-cilember',
                'description' => "Nikmati keindahan alam pegunungan di Villa Kencana Cilember. Terletak dekat dengan air terjun Curug Cilember, villa ini menawarkan udara segar dan pemandangan hijau yang menenangkan.\n\nDilengkapi dengan kolam renang pribadi, halaman rumput luas untuk aktivitas outdoor, dan ruang berkumpul yang nyaman untuk keluarga besar Anda.",
                'short_desc' => 'Villa modern dengan private pool dan pemandangan hijau asri dekat Curug Cilember.',
                'location' => 'Cilember, Cisarua, Bogor',
                'maps_url' => 'https://maps.google.com/?q=Curug+Cilember',
                'bedrooms' => 4,
                'bathrooms' => 3,
                'max_guests' => 12,
                'price_per_night' => 2500000.00,
                'weekend_price' => 3000000.00,
                'min_nights' => 1,
                'amenities' => ['Kolam Renang', 'WiFi', 'AC', 'Dapur Lengkap', 'BBQ Area', 'Water Heater', 'Karaoke'],
                'photos' => [
                    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: setelah pukul 14:00 WIB\nCheck-out: sebelum pukul 12:00 WIB\nDilarang merokok di dalam kamar\nDilarang membawa hewan peliharaan\nJam tenang mulai pukul 22:00 WIB",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Puncak Vista Cabin',
                'slug' => 'puncak-vista-cabin',
                'description' => "Kabin kayu estetik dengan gaya A-frame modern di tengah perkebunan teh Puncak. Tempat pelarian sempurna bagi pasangan atau keluarga kecil yang mencari ketenangan dan pemandangan matahari terbit yang spektakuler.\n\nKabin ini dilengkapi perapian luar ruangan, jacuzzi hangat pribadi, dan kaca jendela besar untuk menikmati bintang di malam hari.",
                'short_desc' => 'Kabin estetik bergaya A-frame dengan private jacuzzi dan pemandangan kebun teh.',
                'location' => 'Tugu Selatan, Cisarua, Bogor',
                'maps_url' => 'https://maps.google.com/?q=Puncak+Pass',
                'bedrooms' => 2,
                'bathrooms' => 1,
                'max_guests' => 4,
                'price_per_night' => 1500000.00,
                'weekend_price' => 1800000.00,
                'min_nights' => 1,
                'amenities' => ['WiFi', 'Dapur Lengkap', 'Water Heater', 'Smart TV', 'Perapian Outdoor', 'Private Jacuzzi'],
                'photos' => [
                    'https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: setelah pukul 14:00 WIB\nCheck-out: sebelum pukul 12:00 WIB\nMenjaga kebersihan kabin\nTidak merusak tanaman di sekitar kabin\nDilarang membuat kebisingan berlebihan",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Bogor Green Valley Resort Villa',
                'slug' => 'bogor-green-valley-resort',
                'description' => "Resort villa mewah di kawasan Gadog, Puncak. Dikelilingi oleh perkebunan teh dan pinus yang rindang, villa ini menawarkan kolam renang infinity dengan pemandangan lembah hijau yang memukau.\n\nCocok untuk family gathering atau staycation bersama keluarga besar.",
                'short_desc' => 'Resort villa mewah dengan infinity pool dan pemandangan lembah hijau di Puncak.',
                'location' => 'Gadog, Cisarua, Bogor',
                'maps_url' => 'https://maps.google.com/?q=Gadog+Bogor',
                'bedrooms' => 5,
                'bathrooms' => 4,
                'max_guests' => 14,
                'price_per_night' => 3800000.00,
                'weekend_price' => 4500000.00,
                'min_nights' => 1,
                'amenities' => ['Kolam Renang', 'WiFi', 'AC', 'Dapur Lengkap', 'Parkir Luas', 'BBQ Area', 'Water Heater', 'Karaoke', 'Meja Billiard'],
                'photos' => [
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00 WIB\nCheck-out: 12:00 WIB\nDilarang merokok di dalam kamar\nJam tenang mulai pukul 22:00",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Puncak Highland Mountain Lodge',
                'slug' => 'puncak-highland-mountain-lodge',
                'description' => 'Pendopo kayu mewah dengan arsitektur khas Jawa Barat yang hangat dan autentik. Terletak di ketinggian 1400 mdpl, lodge ini memberikan pengalaman tinggal di tengah awan dengan pemandangan sunrise yang spektakuler.',
                'short_desc' => 'Pendopo kayu mewah di ketinggian 1400 mdpl dengan view sunrise spektakuler.',
                'location' => 'Cipanas, Cianjur, Bogor',
                'maps_url' => 'https://maps.google.com/?q=Cipanas+Puncak',
                'bedrooms' => 3,
                'bathrooms' => 2,
                'max_guests' => 8,
                'price_per_night' => 2200000.00,
                'weekend_price' => 2800000.00,
                'min_nights' => 1,
                'amenities' => ['WiFi', 'Water Heater', 'Perapian', 'Dapur', 'Terrace', 'Parkir', 'Sarapan'],
                'photos' => [
                    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00 WIB\nCheck-out: 12:00 WIB\nDilarang membawa hewan peliharaan",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Villa Cilember Indah 2 Lantai',
                'slug' => 'villa-cilember-indah-2-lantai',
                'description' => 'Villa dua lantai yang luas dengan halaman belakang menghadap langsung ke aliran sungai alami. Dilengkapi kolam renang anak dan dewasa, area gazebo, dan taman bermain untuk si kecil.',
                'short_desc' => 'Villa 2 lantai dengan kolam renang dan pemandangan sungai alami di Cisarua.',
                'location' => 'Cilember, Cisarua, Bogor',
                'maps_url' => 'https://maps.google.com/?q=Cilember+Bogor',
                'bedrooms' => 4,
                'bathrooms' => 3,
                'max_guests' => 10,
                'price_per_night' => 1850000.00,
                'weekend_price' => 2350000.00,
                'min_nights' => 1,
                'amenities' => ['Kolam Renang', 'WiFi', 'AC', 'Dapur', 'Gazebo', 'Taman Bermain', 'Parkir', 'Water Heater'],
                'photos' => [
                    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600573472550-8090b5e0747d?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1585412727339-54e4bae3bb05?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00\nCheck-out: 12:00\nJam tenang 22:00-06:00",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            // === BANDUNG VILLAS ===
            [
                'name' => 'Dago Mountain View Retreat',
                'slug' => 'dago-mountain-view-retreat',
                'description' => 'Villa eksklusif di kawasan Dago Atas dengan pemandangan lembah Bandung yang memukau. Arsitektur modern minimalis dengan sentuhan kayu hangat, dilengkapi kolam renang pribadi dan area lounge rooftop.',
                'short_desc' => 'Villa eksklusif dengan rooftop lounge dan pemandangan lembah Bandung.',
                'location' => 'Dago Atas, Coblong, Bandung',
                'maps_url' => 'https://maps.google.com/?q=Dago+Bandung',
                'bedrooms' => 3,
                'bathrooms' => 2,
                'max_guests' => 8,
                'price_per_night' => 2750000.00,
                'weekend_price' => 3500000.00,
                'min_nights' => 1,
                'amenities' => ['Kolam Renang', 'Rooftop', 'WiFi', 'AC', 'Dapur Lengkap', 'Smart TV', 'Karaoke', 'Parkir'],
                'photos' => [
                    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00 WIB\nCheck-out: 12:00 WIB\nDilarang merokok di dalam ruangan",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Lembang Pine Forest Cabin',
                'slug' => 'lembang-pine-forest-cabin',
                'description' => 'Kabin kayu eksklusif yang tersembunyi di tengah hutan pinus Lembang. Suasana tenang dan sejuk dengan jacuzzi outdoor, fireplace, dan deck kayu untuk bersantai menikmati kicauan burung.',
                'short_desc' => 'Kabin kayu eksklusif di tengah hutan pinus Lembang dengan jacuzzi outdoor.',
                'location' => 'Lembang, Bandung Barat, Bandung',
                'maps_url' => 'https://maps.google.com/?q=Lembang+Bandung',
                'bedrooms' => 2,
                'bathrooms' => 1,
                'max_guests' => 4,
                'price_per_night' => 1650000.00,
                'weekend_price' => 2000000.00,
                'min_nights' => 1,
                'amenities' => ['Jacuzzi Outdoor', 'WiFi', 'Fireplace', 'Dapur', 'Deck Kayu', 'Parkir', 'Sarapan'],
                'photos' => [
                    'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00 WIB\nCheck-out: 12:00 WIB\nDilarang membawa hewan peliharaan\nJam tenang 21:00",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Bandung Bohemian Resort Villa',
                'slug' => 'bandung-bohemian-resort-villa',
                'description' => 'Villa resort bergaya bohemian dengan taman tropis yang rimbun. Terletak di kawasan Dago Pakar, setiap kamar memiliki akses langsung ke taman. Kolam renang free-form dan area bar outdoor siap memanjakan.',
                'short_desc' => 'Bohemian-style villa dengan taman tropis dan kolam renang free-form di Dago.',
                'location' => 'Dago Pakar, Bandung',
                'maps_url' => 'https://maps.google.com/?q=Dago+Pakar+Bandung',
                'bedrooms' => 4,
                'bathrooms' => 3,
                'max_guests' => 10,
                'price_per_night' => 3200000.00,
                'weekend_price' => 3900000.00,
                'min_nights' => 1,
                'amenities' => ['Kolam Renang', 'Taman', 'Bar Outdoor', 'WiFi', 'AC', 'Dapur Lengkap', 'BBQ', 'Parkir Luas'],
                'photos' => [
                    'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00\nCheck-out: 12:00\nTidak ada pesta/event tanpa izin",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            // === BALI (UBUD) VILLAS ===
            [
                'name' => 'Ubud Rice Terrace Villa',
                'slug' => 'ubud-rice-terrace-villa',
                'description' => 'Villa romantis yang menghadap langsung ke sawah terasering Ubud. Desain open-plan dengan kamar tidur menghadap ke pemandangan hijau, kolam renang pribadi berbentuk free-form, dan gazebo santai.',
                'short_desc' => 'Villa romantis menghadap sawah terasering Ubud dengan kolam renang free-form.',
                'location' => 'Tegalalang, Ubud, Gianyar, Bali',
                'maps_url' => 'https://maps.google.com/?q=Tegalalang+Ubud',
                'bedrooms' => 2,
                'bathrooms' => 2,
                'max_guests' => 4,
                'price_per_night' => 3500000.00,
                'weekend_price' => 3500000.00,
                'min_nights' => 2,
                'amenities' => ['Kolam Renang', 'WiFi', 'AC', 'Gazebo', 'Sarapan', 'Sepeda Gratis', 'Yoga Deck'],
                'photos' => [
                    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00 WITA\nCheck-out: 12:00 WITA\nJaga ketenangan lingkungan sawah",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Ubud Jungle Treehouse Villa',
                'slug' => 'ubud-jungle-treehouse-villa',
                'description' => 'Treehouse villa unik di tengah hutan Ubud Bangkit dengan pemandangan lembah sungai Ayung. Kamar tidur utama memiliki kaca besar dari lantai ke langit-langit untuk pengalaman menginap di tengah kanopi hutan.',
                'short_desc' => 'Treehouse villa unik dengan kolam renang di tengah hutan Ubud.',
                'location' => 'Bangkit, Ubud, Gianyar, Bali',
                'maps_url' => 'https://maps.google.com/?q=Ubud+Bali',
                'bedrooms' => 1,
                'bathrooms' => 1,
                'max_guests' => 2,
                'price_per_night' => 2800000.00,
                'weekend_price' => 3200000.00,
                'min_nights' => 2,
                'amenities' => ['Kolam Renang', 'WiFi', 'AC', 'Floating Breakfast', 'Spa Service', 'Yoga', 'Mini Bar'],
                'photos' => [
                    'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1549638441-b787d2e11f14?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00 WITA\nCheck-out: 12:00 WITA\nCocok untuk pasangan\nTidak untuk pesta",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            // === BALI (SEMINYAK) VILLAS ===
            [
                'name' => 'Seminyak Sunset Beach Villa',
                'slug' => 'seminyak-sunset-beach-villa',
                'description' => 'Villa mewah di kawasan Seminyak, hanya 5 menit berjalan kaki ke Pantai Double Six. Desain tropis kontemporer dengan kolam renang panjang, sun deck, dan area lounge terbuka untuk menikmati sunset Bali.',
                'short_desc' => 'Villa tropis mewah 5 menit dari Pantai Double Six Seminyak.',
                'location' => 'Seminyak, Kuta, Badung, Bali',
                'maps_url' => 'https://maps.google.com/?q=Seminyak+Bali',
                'bedrooms' => 3,
                'bathrooms' => 3,
                'max_guests' => 6,
                'price_per_night' => 5200000.00,
                'weekend_price' => 5800000.00,
                'min_nights' => 2,
                'amenities' => ['Kolam Renang', 'WiFi', 'AC', 'Dapur', 'Sun Deck', 'Bicycle', 'Room Service', 'Parkir'],
                'photos' => [
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 15:00 WITA\nCheck-out: 11:00 WITA\nDilarang membawa hewan peliharaan",
                'check_in_time' => '15:00:00',
                'check_out_time' => '11:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Canggu Boho Beach Villa',
                'slug' => 'canggu-boho-beach-villa',
                'description' => 'Villa bergaya bohemian modern di Canggu, dikelilingi oleh sawah dan hanya 10 menit dari Pantai Berawa. Dilengkapi kolam renang, outdoor shower, dan rooftop terrace untuk bersantai sore.',
                'short_desc' => 'Bohemian villa dekat Pantai Berawa Canggu dengan rooftop terrace.',
                'location' => 'Canggu, Kuta Utara, Badung, Bali',
                'maps_url' => 'https://maps.google.com/?q=Canggu+Bali',
                'bedrooms' => 2,
                'bathrooms' => 2,
                'max_guests' => 4,
                'price_per_night' => 3900000.00,
                'weekend_price' => 4200000.00,
                'min_nights' => 2,
                'amenities' => ['Kolam Renang', 'Rooftop', 'Outdoor Shower', 'WiFi', 'AC', 'Dapur', 'Bicycle', 'Parkir'],
                'photos' => [
                    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00 WITA\nCheck-out: 12:00 WITA\nUntuk keluarga/dewasa",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Jimbaran Luxury Cliff Villa',
                'slug' => 'jimbaran-luxury-cliff-villa',
                'description' => 'Villa super mewah di atas tebing Jimbaran dengan pemandangan Samudra Hindia. Infinity pool tepi tebing, akses pantai pribadi, dan layanan butler 24 jam memberikan pengalaman liburan yang tak terlupakan.',
                'short_desc' => 'Villa super mewah di atas tebing Jimbaran dengan infinity pool dan akses pantai pribadi.',
                'location' => 'Jimbaran, Kuta Selatan, Badung, Bali',
                'maps_url' => 'https://maps.google.com/?q=Jimbaran+Bali',
                'bedrooms' => 4,
                'bathrooms' => 4,
                'max_guests' => 8,
                'price_per_night' => 8500000.00,
                'weekend_price' => 9500000.00,
                'min_nights' => 3,
                'amenities' => ['Infinity Pool', 'WiFi', 'AC', 'Butler 24 Jam', 'Pantai Pribadi', 'Spa', 'Home Theater', 'Wine Cellar'],
                'photos' => [
                    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 15:00 WITA\nCheck-out: 11:00 WITA\nFormal dress code untuk dinner",
                'check_in_time' => '15:00:00',
                'check_out_time' => '11:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Villa Seminyak Garden Paradise',
                'slug' => 'villa-seminyak-garden-paradise',
                'description' => 'Villa di Seminyak tengah dengan taman tropis yang indah. Kolam renang dikelilingi oleh tanaman hijau, area lounging yang nyaman, dan kamar tidur yang elegan. Lokasi strategis dekat dengan restoran dan klub pantai terkenal.',
                'short_desc' => 'Villa mewah di pusat Seminyak dengan taman tropis dan lokasi strategis.',
                'location' => 'Seminyak, Kuta, Badung, Bali',
                'maps_url' => 'https://maps.google.com/?q=Seminyak+Bali',
                'bedrooms' => 2,
                'bathrooms' => 2,
                'max_guests' => 5,
                'price_per_night' => 2800000.00,
                'weekend_price' => 3200000.00,
                'min_nights' => 2,
                'amenities' => ['Kolam Renang', 'Taman', 'WiFi', 'AC', 'Dapur', 'BBQ', 'Smart TV', 'Parkir'],
                'photos' => [
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00 WITA\nCheck-out: 12:00 WITA\nHanya untuk tamu terdaftar",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            // === MALANG VILLAS ===
            [
                'name' => 'Batu Night Villa Panorama',
                'slug' => 'batu-night-villa-panorama',
                'description' => 'Villa megah di kawasan Batu, Malang dengan pemandangan kota Batu di malam hari. Dilengkapi kolam renang air hangat, taman bermain anak, dan karaoke. Cocok untuk family gathering di kota wisata Batu.',
                'short_desc' => 'Villa megah dengan pemandangan kota Batu dan kolam renang air hangat.',
                'location' => 'Oro-oro Ombo, Batu, Malang',
                'maps_url' => 'https://maps.google.com/?q=Batu+Malang',
                'bedrooms' => 4,
                'bathrooms' => 3,
                'max_guests' => 12,
                'price_per_night' => 2100000.00,
                'weekend_price' => 2600000.00,
                'min_nights' => 1,
                'amenities' => ['Kolam Renang Air Hangat', 'WiFi', 'AC', 'Karaoke', 'Taman Bermain', 'Dapur', 'BBQ', 'Parkir Luas'],
                'photos' => [
                    'https://images.unsplash.com/photo-1600573472550-8090b5e0747d?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00 WIB\nCheck-out: 12:00 WIB\nJam tenang 22:00-06:00",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Malang Highlands Resort Villa',
                'slug' => 'malang-highlands-resort-villa',
                'description' => 'Resort villa di dataran tinggi Malang dengan pemandangan Gunung Arjuno. Udara sejuk khas pegunungan, taman lavender yang indah, dan kolam renang dengan view gunung. Tempat yang sempurna untuk melepas penat.',
                'short_desc' => 'Resort villa dengan pemandangan Gunung Arjuno dan taman lavender.',
                'location' => 'Bumiaji, Batu, Malang',
                'maps_url' => 'https://maps.google.com/?q=Bumiaji+Batu',
                'bedrooms' => 3,
                'bathrooms' => 2,
                'max_guests' => 8,
                'price_per_night' => 1800000.00,
                'weekend_price' => 2200000.00,
                'min_nights' => 1,
                'amenities' => ['Kolam Renang', 'Taman Lavender', 'WiFi', 'AC', 'Dapur', 'Gazebo', 'Parkir', 'Sarapan'],
                'photos' => [
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00\nCheck-out: 12:00\nDilarang merokok di dalam ruangan",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Villa Apel Batu Selera',
                'slug' => 'villa-apel-batu-selera',
                'description' => 'Villa bertema apel khas Batu yang unik dan asyik. Dekat dengan pusat oleh-oleh dan wisata Jatim Park. Kolam renang air hangat, ruang bermain anak, dan area karaoke siap menghibur rombongan.',
                'short_desc' => 'Villa tematik di pusat wisata Batu dekat Jatim Park dan pusat oleh-oleh.',
                'location' => 'Temas, Batu, Malang',
                'maps_url' => 'https://maps.google.com/?q=Wisata+Batu',
                'bedrooms' => 5,
                'bathrooms' => 3,
                'max_guests' => 14,
                'price_per_night' => 2500000.00,
                'weekend_price' => 3100000.00,
                'min_nights' => 1,
                'amenities' => ['Kolam Renang Air Hangat', 'WiFi', 'AC', 'Karaoke', 'Taman Bermain', 'Dapur', 'BBQ', 'Parkir Luas'],
                'photos' => [
                    'https://images.unsplash.com/photo-1600573472550-8090b5e0747d?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600573472550-8090b5e0747d?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00\nCheck-out: 12:00\nJaga kebersihan villa",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            // === LOMBOK VILLAS ===
            [
                'name' => 'Senggigi Sunset Hill Villa',
                'slug' => 'senggigi-sunset-hill-villa',
                'description' => 'Villa cantik di atas bukit Senggigi dengan pemandangan laut lepas dan sunset yang memukau. Desain asli Lombok dengan sentuhan modern, kolam renang infinity, dan akses mudah ke Pantai Senggigi.',
                'short_desc' => 'Villa di atas bukit Senggigi dengan infinity pool dan view sunset Lombok.',
                'location' => 'Senggigi, Batu Layar, Lombok Barat',
                'maps_url' => 'https://maps.google.com/?q=Senggigi+Lombok',
                'bedrooms' => 3,
                'bathrooms' => 2,
                'max_guests' => 6,
                'price_per_night' => 1950000.00,
                'weekend_price' => 2500000.00,
                'min_nights' => 1,
                'amenities' => ['Infinity Pool', 'WiFi', 'AC', 'Dapur', 'Sun Deck', 'Parkir', 'Sarapan'],
                'photos' => [
                    'https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00 WITA\nCheck-out: 12:00 WITA\nJaga kebersihan lingkungan",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Lombok Pink Beach Holiday Villa',
                'slug' => 'lombok-pink-beach-holiday-villa',
                'description' => 'Villa eksotis dekat Pink Beach Lombok dengan akses langsung ke pantai pasir merah muda. Desain oceanfront dengan kolam renang dan gazebo tepi pantai. Snorkeling gear dan kayak tersedia gratis.',
                'short_desc' => 'Villa oceanfront dekat Pink Beach Lombok dengan snorkeling gear gratis.',
                'location' => 'Sekaroh, Jerowaru, Lombok Timur',
                'maps_url' => 'https://maps.google.com/?q=Pink+Beach+Lombok',
                'bedrooms' => 2,
                'bathrooms' => 1,
                'max_guests' => 5,
                'price_per_night' => 1400000.00,
                'weekend_price' => 1700000.00,
                'min_nights' => 1,
                'amenities' => ['Kolam Renang', 'Akses Pantai', 'Snorkeling Gear', 'Kayak', 'WiFi', 'Dapur', 'BBQ', 'Parkir'],
                'photos' => [
                    'https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00\nCheck-out: 12:00\nBawa perlengkapan snorkeling sendiri/tambahan",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Gili Trawangan Beachfront Villa',
                'slug' => 'gili-trawangan-beachfront-villa',
                'description' => 'Villa tepi pantai di Gili Trawangan dengan akses langsung ke pasir putih dan laut biru jernih. Desain villa tropis yang lapang, kolam renang halaman depan, dan tempat menyewa sepeda/snorkeling.',
                'short_desc' => 'Villa tepi pantai di Gili Trawangan dengan kolam renang dan akses langsung ke pantai.',
                'location' => 'Gili Trawangan, Lombok Utara',
                'maps_url' => 'https://maps.google.com/?q=Gili+Trawangan',
                'bedrooms' => 2,
                'bathrooms' => 1,
                'max_guests' => 4,
                'price_per_night' => 2200000.00,
                'weekend_price' => 2700000.00,
                'min_nights' => 2,
                'amenities' => ['Kolam Renang', 'Akses Pantai', 'WiFi', 'AC', 'Sewa Sepeda', 'Restoran', 'Diving Center'],
                'photos' => [
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00 WITA\nCheck-out: 11:00 WITA\nTidak ada kendaraan bermotor di Gili",
                'check_in_time' => '14:00:00',
                'check_out_time' => '11:00:00',
                'is_active' => true,
            ],
            // === YOGYAKARTA EXTRA ===
            [
                'name' => 'Malioboro Heritage Villa',
                'slug' => 'malioboro-heritage-villa',
                'description' => 'Villa heritage di pusat kota Yogyakarta, hanya 5 menit dari Malioboro. Bangunan joglo khas Jawa yang dipadukan dengan interior modern minimalis. Halaman luas dan kolam renang di tengah bangunan.',
                'short_desc' => 'Villa heritage bergaya joglo di pusat kota dekat Malioboro Yogyakarta.',
                'location' => 'Sosromenduran, Gedongtengen, Yogyakarta',
                'maps_url' => 'https://maps.google.com/?q=Malioboro+Yogyakarta',
                'bedrooms' => 3,
                'bathrooms' => 2,
                'max_guests' => 8,
                'price_per_night' => 1600000.00,
                'weekend_price' => 1900000.00,
                'min_nights' => 1,
                'amenities' => ['Kolam Renang', 'WiFi', 'AC', 'Dapur', 'Taman', 'Parkir', 'Sarapan Tradisional'],
                'photos' => [
                    'https://images.unsplash.com/photo-1600573472550-8090b5e0747d?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00 WIB\nCheck-out: 12:00 WIB\nHormati budaya lokal\nJam tenang 22:00",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
            [
                'name' => 'Parangtritis Coastal Resort Villa',
                'slug' => 'parangtritis-coastal-resort-villa',
                'description' => 'Villa resort di kawasan Pantai Parangtritis, Yogyakarta. Nikmati suasana pantai selatan dengan pemandangan gumuk pasir dan laut lepas. Kolam renang, restoran seafood, dan area outbound tersedia.',
                'short_desc' => 'Resort villa di Pantai Parangtritis Yogyakarta dengan seafood dan outbound.',
                'location' => 'Parangtritis, Kretek, Bantul, Yogyakarta',
                'maps_url' => 'https://maps.google.com/?q=Parangtritis',
                'bedrooms' => 4,
                'bathrooms' => 3,
                'max_guests' => 10,
                'price_per_night' => 2000000.00,
                'weekend_price' => 2500000.00,
                'min_nights' => 1,
                'amenities' => ['Kolam Renang', 'Restoran', 'WiFi', 'AC', 'Outbound', 'Parkir', 'BBQ', 'Area Api Unggun'],
                'photos' => [
                    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
                ],
                'rules' => "Check-in: 14:00\nCheck-out: 12:00\nJam malam 23:00",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ],
        ];

        $categoriesList = ['Ruang tamu', 'Kamar tidur', 'Dapur', 'Kolam renang', 'Luar ruangan'];
        foreach ($villasData as $data) {
            if (isset($data['photos']) && is_array($data['photos'])) {
                $structuredPhotos = [];
                foreach ($data['photos'] as $idx => $photoUrl) {
                    $category = $categoriesList[$idx % count($categoriesList)];
                    $structuredPhotos[] = [
                        'url' => $photoUrl,
                        'description' => $category.' dari '.$data['name'],
                        'category' => $category,
                    ];
                }
                $data['photos'] = $structuredPhotos;
            }
            $villa = Villa::firstOrCreate(['slug' => $data['slug']], $data);

            if ($villa->slug === 'pulas-private-villa-prawiro-oleh-fulton') {
                $guestNames = [
                    'Andi',
                    'Siti',
                    'Dewi',
                    'Rian',
                    'Fajar',
                    'Tari',
                    'Hendra',
                    'Mega',
                    'Joko',
                    'Gita',
                    'Bagus',
                    'Putu',
                    'Made',
                    'Nyoman',
                    'Ketut',
                    'Laras',
                    'Wati',
                    'Budi',
                    'Eko',
                    'Sari',
                    'Indah',
                    'Agus',
                    'Yanto',
                    'Dian',
                    'Ari',
                    'Guntur',
                    'Rini',
                    'Surya',
                    'Lia',
                    'Rudi',
                ];

                $specificReviews = [
                    [
                        'guest_name' => 'Maximilian',
                        'guest_avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
                        'guest_subtitle' => '8 tahun bergabung di Airbnb',
                        'rating' => 5,
                        'comment' => 'Flat kecil yang benar-benar nyaman dengan kolam renang pribadi yang sangat cocok untuk menyejukkan diri selama hari-hari yang panas. Tuan rumah responsif yang sangat perhatian. Ada sedikit kerusakan, tetapi tidak ada yang besar. Hanya sedikit hal yang mengganggu adalah suara semacam hewan yang merayap di atap, tetapi saya diberi tahu bahwa hal itu biasa terjadi di Indonesia! Sangat direkomendasikan!',
                    ],
                    [
                        'guest_name' => 'Jessica',
                        'guest_avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
                        'guest_subtitle' => '7 tahun bergabung di Airbnb',
                        'rating' => 5,
                        'comment' => 'Kami senang menginap di PULAS, lokasinya luar biasa!! Jika Anda tidur lebih awal dan tidak suka kebisingan, mungkin ini tidak cocok untuk Anda karena jalan tempat kami berada agak ramai. Namun, untuk liburan, ini sangat pas!',
                    ],
                    [
                        'guest_name' => 'Sabrina',
                        'guest_avatar' => 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
                        'guest_subtitle' => '9 tahun bergabung di Airbnb',
                        'rating' => 5,
                        'comment' => 'Kami bersenang-senang di tempat ini dan menikmati terutama desain tempat ini. Lokasinya tepat di kota di jalan yang memiliki banyak restoran, tempat kami bisa pergi ke mana saja dengan mudah.',
                    ],
                    [
                        'guest_name' => 'Marina',
                        'guest_avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
                        'guest_subtitle' => 'Zürich, Swiss',
                        'rating' => 5,
                        'comment' => 'Kami merasa sangat nyaman sejak awal. Semuanya sangat bersih dan berbau segar, yang sangat kami hargai. Lokasinya sempurna dan tempat ini sangat lengkap - punya segalanya.',
                    ],
                ];

                $comments = [
                    'Kolam renang di villa ini sangat bersih dan privat. Lokasi dekat sekali dengan pusat keramaian Yogyakarta.',
                    'AC-nya dingin banget, kamarnya luas dan kebersihan villa sangat terjaga dengan baik.',
                    'Tempat tidur nyaman dan suasananya sejuk. Area terdekat dipenuhi dengan restoran enak.',
                    'Pelayanan sangat ramah, check-in gampang banget. Keramahtamahan Bobby patut diacungi jempol.',
                    'Kenyamanan luar biasa selama menginap di sini. Sangat tenang di malam hari meskipun dekat jalan raya.',
                    'Fasilitas lengkap sesuai deskripsi. Wifi kencang untuk kerja dan kolam renang sangat seru.',
                ];

                for ($i = 0; $i < 30; $i++) {
                    $guestName = '';
                    $guestAvatar = null;
                    $guestSubtitle = '';
                    $rating = 5;
                    $comment = '';

                    if ($i < count($specificReviews)) {
                        $guestName = $specificReviews[$i]['guest_name'];
                        $guestAvatar = $specificReviews[$i]['guest_avatar'];
                        $guestSubtitle = $specificReviews[$i]['guest_subtitle'];
                        $rating = $specificReviews[$i]['rating'];
                        $comment = $specificReviews[$i]['comment'];
                    } else {
                        $rating = $i % 6 === 0 ? 4 : 5; // mixture of 4s and 5s to average around 4.8
                        $guestName = $guestNames[$i - count($specificReviews)] ?? ('Tamu '.($i + 1));
                        $comment = $comments[$i % count($comments)];

                        // Pick a random user avatar from unsplash or use generic
                        $avatars = [
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
                            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
                            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
                        ];
                        $guestAvatar = $avatars[$i % count($avatars)];

                        $subtitles = [
                            '2 tahun bergabung di Airbnb',
                            'Bandung, Indonesia',
                            'Sleman, Yogyakarta',
                            'Singapura',
                            'Jakarta, Indonesia',
                            '5 tahun bergabung di Airbnb',
                        ];
                        $guestSubtitle = $subtitles[$i % count($subtitles)];
                    }

                    $mockBooking = Booking::firstOrCreate(
                        ['booking_code' => 'VB-2026-PULAS-'.str_pad($i + 1, 3, '0', STR_PAD_LEFT)],
                        [
                            'villa_id' => $villa->id,
                            'guest_name' => $guestName,
                            'guest_email' => strtolower(str_replace(' ', '', $guestName)).'@example.com',
                            'guest_phone' => '081234567'.str_pad($i, 3, '0', STR_PAD_LEFT),
                            'check_in' => now()->subMonths(3)->addDays($i * 3)->toDateString(),
                            'check_out' => now()->subMonths(3)->addDays($i * 3 + 2)->toDateString(),
                            'total_nights' => 2,
                            'num_guests' => 2,
                            'base_price' => $villa->price_per_night,
                            'total_amount' => $villa->price_per_night * 2,
                            'status' => 'completed',
                            'payment_status' => 'paid',
                            'notes' => 'Seeding review booking',
                        ]
                    );

                    if ($mockBooking->payment_status === 'paid') {
                        Payment::firstOrCreate(
                            ['booking_id' => $mockBooking->id],
                            [
                                'midtrans_order_id' => 'MID-'.$mockBooking->booking_code,
                                'amount' => $mockBooking->total_amount,
                                'status' => 'success',
                                'paid_at' => $mockBooking->check_in,
                                'payment_type' => 'bank_transfer',
                            ]
                        );
                    }

                    Review::firstOrCreate(
                        ['booking_id' => $mockBooking->id],
                        [
                            'villa_id' => $villa->id,
                            'guest_name' => $guestName,
                            'rating' => $rating,
                            'comment' => $comment,
                            'guest_avatar' => $guestAvatar,
                            'guest_subtitle' => $guestSubtitle,
                            'is_approved' => true,
                            'approved_at' => now(),
                            'approved_by' => $admin->id,
                        ]
                    );
                }
            } else {
                // 3. Create a Mock Booking and Review for each other villa
                $booking = Booking::firstOrCreate(
                    ['booking_code' => 'VB-2026-'.str_pad($villa->id, 4, '0', STR_PAD_LEFT)],
                    [
                        'villa_id' => $villa->id,
                        'guest_name' => 'Budi Santoso',
                        'guest_email' => 'budi.santoso@example.com',
                        'guest_phone' => '081234567890',
                        'check_in' => '2026-05-10',
                        'check_out' => '2026-05-12',
                        'total_nights' => 2,
                        'num_guests' => 2,
                        'base_price' => $villa->price_per_night,
                        'total_amount' => $villa->price_per_night * 2,
                        'status' => 'completed',
                        'payment_status' => 'paid',
                        'notes' => 'Minta disiapkan handuk ekstra.',
                        'utm_source' => 'google',
                        'utm_medium' => 'organic',
                    ]
                );

                if ($booking->payment_status === 'paid') {
                    Payment::firstOrCreate(
                        ['booking_id' => $booking->id],
                        [
                            'midtrans_order_id' => 'MID-'.$booking->booking_code,
                            'amount' => $booking->total_amount,
                            'status' => 'success',
                            'paid_at' => $booking->check_in,
                            'payment_type' => 'bank_transfer',
                        ]
                    );
                }

                Review::firstOrCreate(
                    ['booking_id' => $booking->id],
                    [
                        'villa_id' => $villa->id,
                        'guest_name' => $booking->guest_name,
                        'rating' => 5,
                        'comment' => 'Sangat merekomendasikan villa ini! Kebersihannya luar biasa dan pemandangannya sangat indah. Pelayanan ramah sekali.',
                        'is_approved' => true,
                        'approved_at' => now(),
                        'approved_by' => $admin->id,
                    ]
                );
            }
        }

        // 5. Seed Payment Methods
        $paymentMethods = [
            [
                'name' => 'QRIS',
                'code' => 'qris',
                'account_number' => '',
                'account_name' => 'PT PUSAT VILLA INDONESIA',
                'logo_url' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Bank Central Asia (BCA)',
                'code' => 'bca',
                'account_number' => '8019208392',
                'account_name' => 'PT PUSAT VILLA INDONESIA',
                'logo_url' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Bank Mandiri',
                'code' => 'mandiri',
                'account_number' => '1230009876543',
                'account_name' => 'PT PUSAT VILLA INDONESIA',
                'logo_url' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Bank Negara Indonesia (BNI)',
                'code' => 'bni',
                'account_number' => '0987654321',
                'account_name' => 'PT PUSAT VILLA INDONESIA',
                'logo_url' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Bank Rakyat Indonesia (BRI)',
                'code' => 'bri',
                'account_number' => '5678912345',
                'account_name' => 'PT PUSAT VILLA INDONESIA',
                'logo_url' => null,
                'is_active' => false,
            ],
        ];

        foreach ($paymentMethods as $pm) {
            PaymentMethod::firstOrCreate(['code' => $pm['code']], $pm);
        }

        // 6. Seed Blocked Dates for first villa (next 30 days, random weekends)
        $firstVilla = Villa::first();
        if ($firstVilla) {
            $blockedCount = 0;
            for ($i = 1; $i <= 30; $i++) {
                $date = Carbon::now()->addDays($i);
                if ($date->isWeekend() && $blockedCount < 4) {
                    BlockedDate::firstOrCreate(
                        ['villa_id' => $firstVilla->id, 'date' => $date->toDateString()],
                        [
                            'reason' => 'Sudah dibooking via Airbnb',
                            'created_by' => $admin->id,
                            'source' => 'external',
                        ]
                    );
                    $blockedCount++;
                }
            }
        }
    }
}
