# Panduan Deploy ke cPanel — www.pusatvillaid.com

## Arsitektur

```
www.pusatvillaid.com  ──►  Frontend (Next.js)   ──►  client-side React SPA
api.pusatvillaid.com  ──►  Backend  (Laravel)    ──►  API /api/v1 + Admin Inertia
```

Keduanya **dipisah** karena:
- Frontend: Next.js `'use client'` SPA (semua halaman client-side)
- Backend: Laravel API (`/api/v1`) + Inertia admin dashboard

---

## 📦 Persiapan Build

### 1. Backend — Laravel (`pusatvillaid/`)

Buka terminal di folder `pusatvillaid/`:

```bash
# 1. Hapus file .env lama, rename .env.example, isi data production
composer install --no-dev --optimize-autoloader

# 2. Build frontend assets (Inertia admin)
npm install
npm run build

# 3. Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 4. Buat storage link
php artisan storage:link
```

### 2. Frontend — Next.js (`frontend/`)

Buka terminal di folder `frontend/`:

```bash
npm install
npm run build
```

Hasil build ada di `frontend/.next/` (standalone mode).

---

## 🚀 Cara 1: Subdomain (RECOMMENDED)

cPanel biasanya support **Node.js Selector** untuk jalanin Next.js.

### A. Deploy Backend — `api.pusatvillaid.com`

#### Di cPanel:

1. **Buat subdomain** `api.pusatvillaid.com`
   - Document root: `api.pusatvillaid.com/public` (default cPanel akan saranin)
   - Path fisik: `public_html/api/` atau `api.pusatvillaid.com/`

2. **Upload file backend** via File Manager / FTP ke folder `api.pusatvillaid.com/`
   - Upload semua folder & file kecuali `node_modules/`, `.env`, `storage/framework/cache/data/`

3. **Setup `.env`** — isi dengan:

```env
APP_NAME="PusatVillaID"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.pusatvillaid.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=pusatvillaid_prod
DB_USERNAME=root
DB_PASSWORD=password_anda

SESSION_DRIVER=file
SESSION_DOMAIN=.pusatvillaid.com

SANCTUM_STATEFUL_DOMAINS=www.pusatvillaid.com
FRONTEND_URL=https://www.pusatvillaid.com

# Email
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=email_anda@gmail.com
MAIL_PASSWORD=password_app_gmail
MAIL_FROM_ADDRESS="noreply@pusatvillaid.com"
MAIL_FROM_NAME="PusatVillaID.com"
```

4. **Set Document Root** → `public/` (cPanel > Domains > api.pusatvillaid.com > Document Root: `public`)

5. **Run migration** via Terminal cPanel / SSH:
```bash
cd api.pusatvillaid.com
php artisan migrate --force
```

6. **Buat cron job** untuk scheduler:
   - Settings: `* * * * * /usr/local/bin/php /home/user/api.pusatvillaid.com/artisan schedule:run >> /dev/null 2>&1`

7. **Set permission**:
   - `storage/` → 775
   - `bootstrap/cache/` → 775

### B. Deploy Frontend — `www.pusatvillaid.com`

#### Di cPanel:

1. **Cari "Setup Node.js App"** (biasanya di bagian Software)

2. **Buat Node.js App baru**:
   - **App root**: `frontend` (path relatif dari home)
   - **Document root**: `public`
   - **Node.js version**: 20.x atau 22.x
   - **App mode**: Production
   - **App startup file**: `node_modules/next/dist/bin/next start` (atau pakai npm script `"start": "next start -p $PORT"`)

3. **Upload file frontend** via FTP ke folder `frontend/`:
   - Upload semua file (kecuali `node_modules/`)
   - Upload hasil build: folder `.next/`

4. **Buat file `.env`** di folder `frontend/`:

```env
NEXT_PUBLIC_BACKEND_URL=https://api.pusatvillaid.com
NEXT_PUBLIC_API_URL=https://api.pusatvillaid.com/api/v1
NEXT_PUBLIC_WHATSAPP_NUMBER=6281234567890
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-key-anda
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true
```

5. **Install dependencies & start** (lewat Node.js app panel):
```bash
cd frontend
npm install
```

6. **Start Node.js App** — cPanel akan jalanin `next start` di port internal, dan reverse proxy ke `www.pusatvillaid.com`.

7. **Selesai!** Frontend di `www.pusatvillaid.com`, backend API di `api.pusatvillaid.com`.

---

## 🚀 Cara 2: Single Domain (Jika cPanel TIDAK support Node.js)

Jika hosting tidak support Node.js, kita export Next.js jadi file statis, lalu taruh di Laravel.

### A. Build Next.js sebagai static files

Di folder `frontend/`:

1. Update `next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

2. Build:
```bash
npm run build
```

3. Hasil export ada di `frontend/out/`

### B. Setup di cPanel

1. **Upload Laravel** ke `public_html/`
   - Ikuti langkah A (deploy backend) di Cara 1

2. **Upload hasil export Next.js** ke `public_html/public/site/`

3. **Edit `public_html/public/.htaccess`** — tambahkan rewrite rules:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Redirect root ke site/
    RewriteRule ^$ site/ [L]

    # Fallback untuk Next.js dynamic routing /villas/[slug]/ pada static export (Cara 2)
    RewriteCond %{REQUEST_URI} ^/villas/([^/]+)/?$
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ site/villas/placeholder/index.html [L]

    # Jika request bukan ke /api/ atau file yang ada, arahkan ke site/
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ site/$1 [L]

    # Handle Laravel (api/ routes)
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^ index.php [L]
</IfModule>
```

4. **Update `.env` frontend** (di codebase):
```env
NEXT_PUBLIC_BACKEND_URL=https://www.pusatvillaid.com
NEXT_PUBLIC_API_URL=https://www.pusatvillaid.com/api/v1
```

5. **Akses**: `www.pusatvillaid.com` → Next.js SPA, `www.pusatvillaid.com/api/v1/*` → Laravel API.

---

## ⚙️ Konfigurasi Lingkungan

### File-file yang perlu diubah untuk production:

| File | Perubahan |
|---|---|
| `frontend/.env.local` | Ganti `localhost` → `api.pusatvillaid.com` / `www.pusatvillaid.com` |
| `frontend/next.config.ts` | Tambah `output: 'standalone'` (Cara 1) atau `output: 'export'` (Cara 2) |
| `pusatvillaid/.env` | Ganti `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, DB, dll |

---

## 🔁 Update Setelah Deploy

```bash
# Backend
cd api.pusatvillaid.com
git pull
composer install --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
cd frontend
git pull
npm install
npm run build
# Restart Node.js App via cPanel
```

---

## ⚠️ Checklist Sebelum Live

- [ ] SSL/HTTPS aktif (cPanel > SSL/TLS > AutoSSL)
- [ ] `APP_DEBUG=false` di `.env` Laravel
- [ ] `APP_ENV=production` di `.env` Laravel
- [ ] Database sudah diisi data (villa, destinasi, dll)
- [ ] Storage link sudah dibuat (`php artisan storage:link`)
- [ ] Crontab scheduler sudah aktif
- [ ] Queue worker jalan (jika pakai queue)
- [ ] Test API: `https://api.pusatvillaid.com/api/v1/villas`
- [ ] Test Frontend: `https://www.pusatvillaid.com`
- [ ] Google OAuth redirect URI diubah ke production
- [ ] Midtrans key diubah ke production
- [ ] Hapus file `.env` dari version control (sudah di `.gitignore`?)
