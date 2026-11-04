#!/bin/bash
# Cloudflare Pages 'daterbase-app' (app.daterbase.net) 빌드: 배포용과 공개 페이지만 꺼냄. 개인용(맨 위 파일)은 안 들어감.
# Pages 설정: 빌드 명령 = bash cf/build_app.sh, 출력 폴더 = cf_app
set -e
rm -rf cf_app && mkdir -p cf_app
cp -r share skins help guide about cf_app/
for f in privacy.html favicon.svg apple-touch-icon.png icon-192.png icon-512.png icon-maskable-512.png LICENSE OPEN_SOURCE_NOTICES.txt; do [ -f "$f" ] && cp "$f" cf_app/; done
cat > cf_app/index.html <<'H'
<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Daterbase</title>
<script>location.replace("/share/"+location.search+location.hash)</script>
<a href="/share/">Daterbase 열기</a>
H
cat > cf_app/_headers <<'H'
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
/*/version.json
  Cache-Control: no-store
  Access-Control-Allow-Origin: *
/share/index.html
  Cache-Control: no-cache
H
echo "cf_app: $(find cf_app -type f | wc -l) files"
