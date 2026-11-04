#!/bin/bash
# Cloudflare Pages 'daterbase-me' (me.daterbase.net, Cloudflare Access로 04만) 빌드: 개인용 파일만 꺼냄.
# Pages 설정: 빌드 명령 = bash cf/build_me.sh, 출력 폴더 = cf_me
set -e
rm -rf cf_me && mkdir -p cf_me
for f in *; do case "$f" in share|pcapp|tools|cf|cf_app|cf_me|node_modules) continue;; esac; cp -r "$f" cf_me/; done
cat > cf_me/_headers <<'H'
/*
  X-Robots-Tag: noindex, nofollow
  X-Content-Type-Options: nosniff
/version.json
  Cache-Control: no-store
  Access-Control-Allow-Origin: *
/index.html
  Cache-Control: no-cache
H
echo "cf_me: $(find cf_me -type f | wc -l) files"
