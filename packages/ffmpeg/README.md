# ffmpeg

based on https://github.com/hi-ogawa/ffmpeg-experiment

```sh
pnpm build
pnpm release

# cli
ffmpeg-emscripten -i=../flac-picture/misc/test.webm:/in.webm -o=test.opus:/out.opus -- -i /in.webm -c copy -metadata title=hello /out.opus

# native build
bash misc/ffmpeg-build-local.sh
./build/ffmpeg/local/ffmpeg -h

ffmpeg -i in.mp4 -f ffmetadata in.txt
```

```sh
# download test files (webm and jpg)
youtube-dl -f 251 -o test.webm https://www.youtube.com/watch?v=le0BLAEO93g
wget -O test.jpg https://i.ytimg.com/vi/le0BLAEO93g/maxresdefault.jpg

#
# native build
#
bash misc/ffmpeg-configure.sh "$PWD/build/native/ffmpeg" --prefix="$PWD/build/native/ffmpeg/prefix" \
  --disable-autodetect --disable-everything --disable-asm --disable-doc \
  --enable-protocol=file \
  --enable-demuxer=webm_dash_manifest,ogg,mjpeg \
  --enable-muxer=opus,mjpeg \
  --enable-encoder=opus,mjpeg \
  --enable-decoder=opus,mjpeg
make -j -C build/native/ffmpeg install

cmake . -B build/native/Debug -DCMAKE_BUILD_TYPE=Debug
cmake --build build/native/Debug
./build/native/Debug/ex00 convert --in test.webm --out test.out.opus --out-format opus --thumbnail test.jpeg --title "Dean Town" --artist "VULFPECK" --start-time 10 --end-time 21
./build/native/Debug/ex00 convert --in test.out.opus --out test.out.jpg --out-format mjpeg
./build/native/Debug/ex00 extract-metadata --in test.out.opus

#
# emscripten build inside docker
#
pnpm emscripten bash misc/ffmpeg-configure.sh "/app/build/emscripten/ffmpeg" --prefix="/app/build/emscripten/ffmpeg/prefix" \
  --enable-cross-compile \
  --cc=/emsdk/upstream/emscripten/emcc \
  --cxx=/emsdk/upstream/emscripten/em++ \
  --ar=/emsdk/upstream/emscripten/emar \
  --ld=/emsdk/upstream/emscripten/emcc \
  --nm=/emsdk/upstream/bin/llvm-nm \
  --ranlib=/emsdk/upstream/emscripten/emranlib \
  --target-os=none --arch=x86_32 \
  --disable-autodetect --disable-everything --disable-asm --disable-doc --disable-programs \
  --enable-demuxer=webm_dash_manifest,ogg,mjpeg \
  --enable-muxer=opus,mjpeg \
  --enable-encoder=opus,mjpeg \
  --enable-decoder=opus,mjpeg
pnpm emscripten make -j -C build/emscripten/ffmpeg install

# Debug build is too slow
pnpm emscripten cmake . -B build/emscripten/Release -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake
pnpm emscripten cmake --build build/emscripten/Release
pnpm ts ./src/cpp/ex00-emscripten-cli.ts convert --in test.webm --out test.out.opus --out-format opus --thumbnail test.jpg --title "Dean Town" --artist "VULFPECK" --start-time 10 --end-time 21
pnpm ts ./src/cpp/ex00-emscripten-cli.ts convert --in test.out.opus --out test.out.jpg --out-format mjpeg
pnpm ts ./src/cpp/ex00-emscripten-cli.ts extract-metadata --in test.out.opus
```
