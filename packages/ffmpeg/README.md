# ffmpeg/libwebm

emscripten port of ffmepg (libavformat) and libwebm.
exposing very small set of webm/opus manipulation utilities via embind-based wrapper.

```sh
pnpm build
pnpm release

# cli
ffmpeg-emscripten -i=./test.webm:/in.webm -o=test.out.opus:/out.opus -- -i /in.webm -c copy -metadata title=hello /out.opus
```

## development

```sh
# download test files (webm and jpg)
youtube-dl -f 251 -o test.webm https://www.youtube.com/watch?v=le0BLAEO93g
wget -O test.jpg https://i.ytimg.com/vi/le0BLAEO93g/maxresdefault.jpg

#
# native build (easier to debug)
#
bash misc/ffmpeg-configure.sh "$PWD/build/native/ffmpeg" --prefix="$PWD/build/native/ffmpeg/prefix" \
  --disable-autodetect --disable-everything --disable-asm --disable-doc \
  --enable-protocol=file \
  --enable-demuxer=webm_dash_manifest,ogg,mjpeg \
  --enable-muxer=opus,mjpeg \
  --enable-encoder=opus,mjpeg \
  --enable-decoder=opus,mjpeg
make -j -C build/native/ffmpeg install

meson setup build/native/Debug
meson compile -C build/native/Debug
./build/native/Debug/ex00 convert --in test.webm --out test.out.opus --out-format opus --thumbnail test.jpeg --title "Dean Town" --artist "VULFPECK" --start-time 10 --end-time 21
./build/native/Debug/ex00 convert --in test.out.opus --out test.out.jpg --out-format mjpeg
./build/native/Debug/ex00 extract-metadata --in test.out.opus
./build/native/Debug/ex01 parse-metadata --in test.webm --slice 1000  # only first 1KB is needed to extract all cue points
./build/native/Debug/ex01 parse-frames --in test.webm --slice-start $((3154391 + 48)) # cluster of last cue point
./build/native/Debug/ex01 remux --in test.webm --out test.out.webm --slice-start $((134457 + 48)) --slice-end $((267084 + 48)) # 2nd cluster
./build/native/Debug/ex00 convert --in test.out.webm --out test.out.opus --out-format opus

#
# emscripten build inside docker
#
pnpm emscripten bash misc/ffmpeg-build-emscripten.sh

pnpm emscripten meson setup build/emscripten/Release --cross-file meson-cross-file-emscripten.ini --buildtype release
pnpm emscripten meson compile -C build/emscripten/Release
pnpm ts ./src/cpp/ex00-emscripten-cli.ts convert --in test.webm --out test.out.opus --outFormat opus --thumbnail test.jpg --title "Dean Town" --artist "VULFPECK" --startTime 10 --endTime 21
pnpm ts ./src/cpp/ex00-emscripten-cli.ts convert --in test.out.opus --out test.out.jpg --outFormat mjpeg
pnpm ts ./src/cpp/ex00-emscripten-cli.ts extractMetadata --in test.out.opus
pnpm ts ./src/cpp/ex01-emscripten-cli.ts parseMetadata --in test.webm --slice 1000
pnpm ts ./src/cpp/ex01-emscripten-cli.ts remux --in test.webm --out test.out.webm --startTime 35 --endTime 45
pnpm ts ./src/cpp/ex01-emscripten-cli.ts remux --in test.webm --out test.out.webm --startTime 35 --endTime 45 --fixTimestamp false
pnpm ts ./src/cpp/ex00-emscripten-cli.ts convert --in test.out.webm --out test.out.opus --outFormat opus --startTime 35 --endTime 45
```
