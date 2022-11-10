#!/bin/bash
set -eu -o pipefail

if test -z "${no_configure:-}"; then
  echo ":: [configure]"
  bash misc/ffmpeg-configure.sh "$PWD/build/ffmpeg/local" --prefix="$PWD/build/ffmpeg/local" \
    --disable-autodetect --disable-everything --disable-asm --disable-doc --disable-stripping \
    --enable-protocol=file \
    --enable-demuxer=webm_dash_manifest,ogg,mjpeg,ffmetadata \
    --enable-muxer=opus,mjpeg,ffmetadata \
    --enable-encoder=opus \
    --enable-decoder=opus
fi

if test -z "${no_make:-}"; then
  echo ":: [make]"
  make -j -C build/ffmpeg/local
fi
