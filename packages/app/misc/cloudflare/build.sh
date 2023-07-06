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
esbuild dist/server/index.js --outfile=dist/cloudflare/index.js --metafile=dist/esbuild-metafile.json \
  --bundle --minify --format=esm --platform=browser \
  --external:__STATIC_CONTENT_MANIFEST \
  --external:node:async_hooks

# dist/cloudflare/bucket
cp -r dist/client/assets dist/cloudflare/bucket/assets
