#!/bin/bash

set -e

echo "=== Awesome Rank 업데이트 스크립트 ==="
echo ""

cd /projects/worldrank

echo "[1/4] Git Pull..."
git pull

echo ""
echo "[2/4] 의존성 설치..."
npm run install:all

echo ""
echo "[3/4] 프론트엔드 빌드..."
npm run build

echo ""
echo "[4/4] PM2 서버 재시작..."
if pm2 describe worldrank >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --only worldrank --update-env
else
  pm2 start ecosystem.config.cjs --only worldrank --update-env
fi
pm2 save

echo ""
echo "=== 업데이트 완료 ==="
pm2 status worldrank
