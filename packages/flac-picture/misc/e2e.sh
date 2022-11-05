#!/bin/bash
set -eu -o pipefail

encoded=$(pnpm -s cli < misc/test.jpg)

ffmpeg -hide_banner -i misc/test.opus -c copy -metadata "METADATA_BLOCK_PICTURE=$encoded" misc/test-out.opus

ffprobe -hide_banner misc/test-out.opus
