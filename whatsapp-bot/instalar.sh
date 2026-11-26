#!/usr/bin/env bash
# Instala el bot en un VPS Ubuntu limpio. Uso: bash instalar.sh
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null || [ "$(node -v | cut -c2- | cut -d. -f1)" -lt 20 ]; then
  echo "==> Instalando Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

command -v pm2 >/dev/null || { echo "==> Instalando PM2..."; npm install -g pm2; }

echo "==> Instalando dependencias del bot..."
npm install --omit=dev

if [ ! -f .env ]; then
  cp .env.example .env
  read -rp "Tu número personal para recibir avisos (ej. 595981123456): " ADMIN
  sed -i "s/^ADMIN_NUMBER=.*/ADMIN_NUMBER=${ADMIN//[^0-9]/}/" .env
fi

timedatectl set-timezone America/Asuncion 2>/dev/null || true

echo
echo "✅ Instalado. Ahora vinculá el número:"
echo "   npm start        (escaneá el QR y, cuando diga Conectado, Ctrl+C)"
echo "   pm2 start ecosystem.config.cjs && pm2 save && pm2 startup"
