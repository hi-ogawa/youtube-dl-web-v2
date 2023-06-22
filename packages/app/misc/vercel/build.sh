#!/bin/bash
set -eu -o pipefail

# copied from https://github.com/hi-ogawa/vite-server-build-example/blob/cd85c7542827f78a81b8177a689922209cab0597/misc/vercel/build.sh#L4-L6

# https://vercel.com/docs/build-output-api/v3/primitives#edge-functions

# .vercel/
#   project.json
#   output/
#     config.json
#     static/              = dist/client
#     functions/
#       index.func/
#         .vc-config.json
#         index.js         = dist/server/index.mjs

# clean
rm -rf .vercel/output
mkdir -p .vercel/output/functions/index.func

# config.json
cp misc/vercel/config.json .vercel/output/config.json

# static
cp -r dist/client .vercel/output/static

# serverless
cp dist/server/index.js .vercel/output/functions/index.func/index.js
cp misc/vercel/.vc-config.json .vercel/output/functions/index.func/.vc-config.json
