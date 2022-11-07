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
