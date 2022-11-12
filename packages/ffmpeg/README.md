# ffmpeg

based on https://github.com/hi-ogawa/ffmpeg-experiment

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

cmake . -B build/native/Debug -DCMAKE_BUILD_TYPE=Debug
cmake --build build/native/Debug
./build/native/Debug/ex00 convert --in test.webm --out test.out.opus --out-format opus --thumbnail test.jpeg --title "Dean Town" --artist "VULFPECK" --start-time 10 --end-time 21
./build/native/Debug/ex00 convert --in test.out.opus --out test.out.jpg --out-format mjpeg
./build/native/Debug/ex00 extract-metadata --in test.out.opus

#
# emscripten build inside docker
#
pnpm emscripten bash misc/ffmpeg-build-wasm.sh

# Debug build is too slow
pnpm emscripten cmake . -B build/emscripten/Release -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake
pnpm emscripten cmake --build build/emscripten/Release
pnpm ts ./src/cpp/ex00-emscripten-cli.ts convert --in test.webm --out test.out.opus --out-format opus --thumbnail test.jpg --title "Dean Town" --artist "VULFPECK" --start-time 10 --end-time 21
pnpm ts ./src/cpp/ex00-emscripten-cli.ts convert --in test.out.opus --out test.out.jpg --out-format mjpeg
pnpm ts ./src/cpp/ex00-emscripten-cli.ts extract-metadata --in test.out.opus
```
