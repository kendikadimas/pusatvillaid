# Panduan Setup Otomatisasi Sinkronisasi Kalender iCal (Cron Job)

Sistem sinkronisasi kalender iCal menggunakan Laravel Console Command `ical:sync` yang dapat berjalan secara otomatis di latar belakang (background) untuk memperbarui ketersediaan kamar villa dari OTA (Airbnb, Booking.com, dsb.).

Untuk menjalankan sinkronisasi ini secara berkala, Anda perlu memasang cron job penjadwal (scheduler) baik di hosting cPanel maupun server VPS Anda.

---

## Opsi 1: Setup di cPanel Hosting (Rekomendasi Shared Hosting)

Jika web server Anda menggunakan cPanel, ikuti langkah berikut:

1. **Masuk ke cPanel** akun hosting Anda.
2. Cari dan klik menu **Cron Jobs** (Tugas Cron) yang terletak di bagian *Advanced*.
3. Pada bagian **Add New Cron Job**:
   - **Common Settings**: Pilih rentang waktu yang diinginkan, misalnya **Once Per 15 Minutes** (`*/15 * * * *`) atau **Once Per 30 Minutes** (`*/30 * * * *`).
   - **Command**: Masukkan path lengkap PHP CLI server Anda beserta command Laravel. Format umumnya adalah sebagai berikut:
     ```bash
     /usr/local/bin/php /home/username/public_html/pusatvillaid/artisan ical:sync > /dev/null 2>&1
     ```
     > **Catatan Penting:**
     > - Ganti `/usr/local/bin/php` dengan lokasi real PHP binary di hosting Anda (bisa didapatkan di tab informasi sistem cPanel, atau tanyakan provider hosting Anda).
     > - Ganti `/home/username/public_html/pusatvillaid/artisan` dengan path absolut yang merujuk ke file `artisan` di direktori Laravel Anda.

4. Klik **Add New Cron Job**.

---

## Opsi 2: Setup di VPS Server (Ubuntu / Debian / CentOS)

Jika Anda menggunakan VPS Linux yang dikelola secara manual:

1. Masuk ke VPS menggunakan SSH.
2. Buka konfigurasi crontab sistem dengan menjalankan perintah:
   ```bash
   crontab -e
   ```
3. Tambahkan baris berikut di bagian paling bawah file crontab untuk menjalankan Laravel Task Scheduler setiap menit (Laravel akan mengatur waktu eksekusi internal):
   ```bash
   * * * * * cd /var/www/pusatvillaid && php artisan schedule:run >> /dev/null 2>&1
   ```
   > **Catatan:** Ganti `/var/www/pusatvillaid` dengan path absolut folder project Laravel Anda di server.

4. Jika Anda ingin memicu perintah `ical:sync` secara langsung tanpa melalui Laravel Scheduler (misal setiap 15 menit):
   ```bash
   */15 * * * * cd /var/www/pusatvillaid && php artisan ical:sync >> /var/www/pusatvillaid/storage/logs/ical_sync.log 2>&1
   ```
   *Perintah di atas juga akan menyimpan log aktivitas sinkronisasi ke dalam file `storage/logs/ical_sync.log`.*

5. Simpan dan keluar dari editor crontab (misalnya `Ctrl + O` lalu `Ctrl + X` pada nano editor).

---

## Opsi 3: Menggunakan Laravel Task Scheduler (Alternatif)

Laravel sudah menyediakan scheduler bawaan di dalam `app/Console/Kernel.php`. Perintah `ical:sync` telah didaftarkan agar otomatis berjalan setiap 15 menit di level aplikasi. 

Dengan setup opsi crontab satu-menit (`* * * * * ... php artisan schedule:run`), Laravel otomatis menangani waktu eksekusi:

```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule)
{
    $schedule->command('ical:sync')->everyFifteenMinutes()->withoutOverlapping();
}
```

---

## Verifikasi & Monitoring

1. **Jalankan Uji Coba Manual**:
   Untuk memastikan command tidak error sebelum dipasang di cron job, jalankan langsung dari root directory project Anda:
   ```bash
   php artisan ical:sync
   ```
2. **Periksa Log**:
   Jika terjadi kendala saat sinkronisasi otomatis, Anda dapat melihat log sistem Laravel di:
   `storage/logs/laravel.log`
