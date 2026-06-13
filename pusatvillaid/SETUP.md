# Setup Produksi — PusatVilla.id

## 📧 Email Konfirmasi Booking

Dua opsi gratis — pilih salah satu:

### Opsi 1: Resend (100 email/hari — gratis selamanya)

**Daftar:**
1. Buka [resend.com](https://resend.com) → Register
2. Verifikasi email
3. Dashboard → **Add Domain** → masukkan domain Anda (misal: `pusatvilla.id`)
4. Salin **DNS records** yang diberikan, lalu tambahkan ke cPanel:
   - cPanel → **Zone Editor** → pilih domain → **Add Record**
   - Tambahkan **TXT**, **MX**, dan **CNAME** sesuai petunjuk Resend
5. Klik **Verify** di Resend — tunggu 1–10 menit
6. Dashboard → **API Keys** → **Create API Key** → simpan key-nya

**Install & config:**

```bash
cd pusatvillaid
composer require resend/resend-laravel
```

Edit `.env`:

```env
MAIL_MAILER=resend
MAIL_FROM_ADDRESS=noreply@pusatvilla.id
MAIL_FROM_NAME="PusatVilla.id"
RESEND_API_KEY=re_xxxxxxxxxxxx
```

**Test kirim:**

```bash
php artisan tinker
```

```php
Mail::raw('Test Resend', fn($m) => $m->to('email-anda@gmail.com')->subject('Test'));
$booking = App\Models\Booking::with('villa', 'payment')->first();
Mail::to($booking->guest_email)->send(new App\Mail\BookingConfirmationMail($booking));
```

---

### Opsi 2: Brevo (300 email/hari — gratis selamanya)

**Daftar:**
1. Buka [brevo.com](https://www.brevo.com) → Register
2. Verifikasi email & domain
3. Dashboard → **SMTP & API** → **SMTP Keys** → **Generate SMTP key**
4. Simpan key-nya

**Config `.env`:**

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=email-anda@gmail.com
MAIL_PASSWORD=xsmtp_xxxxxxxxxxxx
MAIL_FROM_ADDRESS=noreply@pusatvilla.id
MAIL_FROM_NAME="PusatVilla.id"
```

> **Catatan:** Pastikan `MAIL_USERNAME` diisi dengan email login Brevo Anda (bukan API key).

**Test kirim:**

```bash
php artisan tinker
Mail::raw('Test Brevo', fn($m) => $m->to('email-anda@gmail.com')->subject('Test'));
```

---

## ⚙️ Queue Worker (WAJIB)

Email dikirim via queue. Laravel pakai tabel `jobs` (database driver).

### Di cPanel — Cron Job

1. Buka cPanel → **Cron Jobs**
2. Buat cron job baru (jalan tiap menit):
   ```
   * * * * * /usr/local/bin/php /home/{username}/public_html/artisan queue:work --tries=3 --timeout=60 --sleep=3 --queue=default 2>&1
   ```
   Atau pakai `flock` biar gak dobel proses:
   ```
   * * * * * flock -n /tmp/queue.lock /usr/local/bin/php /home/{username}/public_html/artisan queue:work --tries=3 --timeout=60 --sleep=3 --queue=default 2>&1
   ```
3. Ganti `{username}` dengan username cPanel Anda
4. Ganti `public_html` jika project ada di subfolder

**Testing:** `php artisan queue:work --once`

---

## 🗂️ Storage Link (Foto Villa)

```bash
php artisan storage:link
```

Pastikan folder `storage/app/public` dan `public/storage` ada.

---

## 🔐 Cache & Optimize

```bash
php artisan key:generate
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

> **Catatan:** Setiap kali ubah `.env`, jalankan ulang `php artisan config:cache`

---

## 🌐 Frontend (Next.js)

**Build:**

```bash
cd frontend
npm ci
npm run build
```

**cPanel Node.js Setup:**
1. cPanel → **Setup Node.js App**
2. Pilih folder `frontend/`
3. Application mode: **Production**
4. Startup file: `node_modules/next/dist/bin/next start`
5. Environment:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_API_URL=https://domain-anda.com/api/v1`
   - `NEXT_PUBLIC_BACKEND_URL=https://domain-anda.com`

---

## ✅ Checklist Deploy

- [ ] Domain diverifikasi di Resend/Brevo
- [ ] `.env` diisi lengkap (DB, Resend/Brevo, Midtrans, APP_URL)
- [ ] `composer install --optimize-autoloader --no-dev`
- [ ] `php artisan storage:link`
- [ ] `php artisan migrate --force`
- [ ] `php artisan config:cache`
- [ ] `php artisan route:cache`
- [ ] Cron job queue worker terdaftar
- [ ] SSL aktif (cPanel → SSL/TLS)
- [ ] `php artisan test` lulus
- [ ] Storage & log writable (foto villa, logs)

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Email masuk spam | Tambah SPF/DKIM/DMARC record di cPanel (ikuti petunjuk dari Resend/Brevo) |
| Queue worker mati | Cek `storage/logs/laravel.log`. Pastikan cron job pakai `flock` |
| Storage link error | `rm public/storage` lalu `php artisan storage:link` lagi |
| Midtrans webhook timeout | URL webhook di dashboard Midtrans harus: `https://domain-anda.com/api/v1/payment/notification` |
| 500 error | Cek `storage/logs/laravel.log`. Jalankan `php artisan optimize` |
| Resend API key error | Pastikan `.env` tidak spasi, lalu `php artisan config:cache` |
| Brevo auth failed | `MAIL_USERNAME` harus email login Brevo, `MAIL_PASSWORD` harus SMTP key (bukan password login) |
