#!/bin/bash
set -eu -o pipefail

# https://emscripten.org/docs/porting/pthreads.html
#   PROXY_TO_PTHREAD=1 (non blocking thread creation (otherwise program hangs))
#   PTHREAD_POOL_SIZE_STRICT=0 (allow on-demand thread creation)

build_dir="/app/build/emscripten/ffmpeg"

echo ":: [configure]"
bash misc/ffmpeg-configure.sh "$build_dir" --prefix="$build_dir/prefix" \
  --enable-cross-compile \
  --cc=/emsdk/upstream/emscripten/emcc \
  --cxx=/emsdk/upstream/emscripten/em++ \
  --ar=/emsdk/upstream/emscripten/emar \
  --ld=/emsdk/upstream/emscripten/emcc \
  --nm=/emsdk/upstream/bin/llvm-nm \
  --ranlib=/emsdk/upstream/emscripten/emranlib \
  --extra-ldflags='-s USE_PTHREADS=1 -s PROXY_TO_PTHREAD=1 -s PTHREAD_POOL_SIZE_STRICT=0 -s EXPORT_NAME=ffmpeg -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 --minify 0 -s FILESYSTEM=1 -s EXPORTED_RUNTIME_METHODS=["callMain","FS"]' \
  --target-os=none --arch=x86_32 \
  --disable-autodetect --disable-everything --disable-asm --disable-doc --disable-stripping \
  --enable-protocol=file \
  --enable-demuxer=webm_dash_manifest,ogg,mjpeg \
  --enable-muxer=opus,mjpeg \
  --enable-encoder=opus,mjpeg \
  --enable-decoder=opus,mjpeg

echo ":: [make]"
make -j -C "$build_dir" install EXESUF=.js
