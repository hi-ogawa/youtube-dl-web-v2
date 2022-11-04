#!/bin/bash
set -eu -o pipefail

# usage:
#   bash misc/ffmpeg-configure.sh build/ffmpeg --disable-everything --enable-demuxer=webm_dash_manifest --enable-muxer=opus

this_dir=$(cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd)
project_dir="$(dirname "$this_dir")"
source_dir="$project_dir/third_party/FFmpeg"

build_dir="$1"
shift

mkdir -p "$build_dir"
cd "$build_dir"
"$source_dir/configure" "${@}"
