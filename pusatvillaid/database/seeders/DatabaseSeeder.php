<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Villa;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin PusatVilla',
                'password' => bcrypt('password'), // default password
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
            \App\Models\Destination::firstOrCreate(['query' => $dest['query']], $dest);
        }

        // 2. Create Villas
        $villasData = [
            [
                'name' => 'PULAS Private Villa Prawiro oleh Fulton',
                'slug' => 'pulas-private-villa-prawiro-oleh-fulton',
                'description' => "Perpaduan unik antara desain klasik dan modern, terletak di pusat distrik pariwisata Yogyakarta yang semarak. Hanya satu menit dari jalan Prawirotaman dan 10 menit dari malioboro dengan kendaraan. Nikmati masa inap santai di vila minimalis kami, lengkap dengan kolam renang pribadi, sangat cocok untuk bersantai dan menikmati budaya lokal.",
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
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
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
                    ['name' => 'Fulton Villa', 'avatar' => 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80']
                ],
                'cancellation_policy' => 'Pembatalan gratis selama 24 jam. Setelahnya, biaya reservasi tidak dapat dikembalikan. Baca kebijakan lengkap tuan rumah untuk rincian selengkapnya.',
                'safety_property' => [
                    'Alarm karbon monoksida tidak dilaporkan',
                    'Alarm asap tidak dilaporkan',
                    'Kamera keamanan di bagian luar properti'
                ],
                'neighborhood_desc' => 'Terletak di pusat distrik pariwisata Yogyakarta, di mana Anda bisa berjalan-jalan untuk menemukan restoran lokal, Asia, dan Barat serta berbelanja di butik-butik yang menyenangkan.',
                'highlights' => [
                    ['icon' => 'Waves', 'title' => 'Tunggu apa lagi?', 'description' => 'Ini salah satu dari sedikit tempat di area ini yang menyediakan kolam renang.'],
                    ['icon' => 'Wind', 'title' => 'Dirancang agar tetap sejuk', 'description' => 'Atasi hawa panas dengan AC dan kipas angin gantung.'],
                    ['icon' => 'Key', 'title' => 'Pengalaman check-in sangat baik', 'description' => 'Tamu terakhir menyukai awal yang mulus untuk masa inap ini.']
                ],
                'bedrooms_info' => [
                    ['image' => 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80', 'title' => 'Kamar tidur 1', 'subtext' => '1 tempat tidur king']
                ],
                'accessibility_features' => [
                    ['image' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', 'title' => 'Pintu masuk dan parkir tamu', 'subtext' => 'Tempat parkir penyandang disabilitas'],
                    ['image' => 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80', 'title' => 'Kamar mandi lengkap', 'subtext' => 'Pegangan tetap untuk shower']
                ]
            ],
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
                    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80'
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
                    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80'
                ],
                'rules' => "Check-in: setelah pukul 14:00 WIB\nCheck-out: sebelum pukul 12:00 WIB\nMenjaga kebersihan kabin\nTidak merusak tanaman di sekitar kabin\nDilarang membuat kebisingan berlebihan",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
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
                    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80'
                ],
                'rules' => "Check-in: setelah pukul 14:00 WITA\nCheck-out: sebelum pukul 12:00 WITA\nDilarang berteriak atau berisik yang mengganggu satwa liar sekitar\nDilarang merokok di dalam kamar",
                'check_in_time' => '14:00:00',
                'check_out_time' => '12:00:00',
                'is_active' => true,
            ]
        ];

        foreach ($villasData as $data) {
            $villa = Villa::firstOrCreate(['slug' => $data['slug']], $data);

            if ($villa->slug === 'pulas-private-villa-prawiro-oleh-fulton') {
                $guestNames = [
                    'Andi', 'Siti', 'Dewi', 'Rian', 'Fajar', 'Tari', 'Hendra', 'Mega', 'Joko', 'Gita',
                    'Bagus', 'Putu', 'Made', 'Nyoman', 'Ketut', 'Laras', 'Wati', 'Budi', 'Eko', 'Sari',
                    'Indah', 'Agus', 'Yanto', 'Dian', 'Ari', 'Guntur', 'Rini', 'Surya', 'Lia', 'Rudi'
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
                        $guestName = $guestNames[$i - count($specificReviews)] ?? ('Tamu ' . ($i + 1));
                        $comment = $comments[$i % count($comments)];
                        
                        // Pick a random user avatar from unsplash or use generic
                        $avatars = [
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
                            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
                            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
                        ];
                        $guestAvatar = $avatars[$i % count($avatars)];
                        
                        $subtitles = [
                            '2 tahun bergabung di Airbnb',
                            'Bandung, Indonesia',
                            'Sleman, Yogyakarta',
                            'Singapura',
                            'Jakarta, Indonesia',
                            '5 tahun bergabung di Airbnb'
                        ];
                        $guestSubtitle = $subtitles[$i % count($subtitles)];
                    }
                    
                    $mockBooking = Booking::firstOrCreate(
                        ['booking_code' => 'VB-2026-PULAS-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT)],
                        [
                            'villa_id' => $villa->id,
                            'guest_name' => $guestName,
                            'guest_email' => strtolower(str_replace(' ', '', $guestName)) . '@example.com',
                            'guest_phone' => '081234567' . str_pad($i, 3, '0', STR_PAD_LEFT),
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
                    ['booking_code' => 'VB-2026-' . str_pad($villa->id, 4, '0', STR_PAD_LEFT)],
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
    }
}
