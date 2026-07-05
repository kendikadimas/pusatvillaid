#!/bin/bash
# Deploy script — jalankan ini di server setelah git pull

set -e

echo "===== DEPLOY BACKEND ====="
cd /home/user/api.pusatvillaid.com
git pull origin main
composer install --no-dev --optimize-autoloader --no-interaction

# Pastikan .env production aktif sebelum cache
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "-> .env.production disalin ke .env"
fi

php artisan migrate --force
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link || true

echo "===== DEPLOY FRONTEND ====="
cd /home/user/frontend
git pull origin main
npm ci
npm run build
# rsync hasil build ke public_html
rsync -a --delete out/ /home/user/public_html/

echo "===== SELESAI ====="
