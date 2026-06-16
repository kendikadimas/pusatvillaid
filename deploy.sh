#!/bin/bash
# Deploy script — jalankan ini di server setelah git pull

set -e

echo "===== DEPLOY BACKEND ====="
cd /home/user/api.pusatvillaid.com
git pull origin main
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
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
