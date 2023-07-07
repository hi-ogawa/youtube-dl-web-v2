#!/bin/bash
set -eu -o pipefail

# dist/client
# dist/server

# dist/
#   client/     <- vite build
#   server/     <- vite ssr build
#   cloudflare/
#     index.js
#     bucket

# cleanup
rm -rf dist/cloudflare
mkdir -p dist/cloudflare/bucket

# dist/cloudflare/index.js
ESBUILD_OPTS=(--minify --sourcemap=external)
if [ -n "${DEBUG:-}" ]; then
  # better local preview stacktrace (workerd doesn't support sourcemap anyway?)
  ESBUILD_OPTS=(--sourcemap=inline)
fi
esbuild dist/server/index.js "${ESBUILD_OPTS[@]}" --outfile=dist/cloudflare/index.js --metafile=dist/esbuild-metafile.json \
  --bundle --format=esm --platform=browser --external:__STATIC_CONTENT_MANIFEST

# dist/cloudflare/bucket
cp -r dist/client/assets dist/cloudflare/bucket/assets
