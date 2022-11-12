# flac-picture-encoder

encode an image file (jpg, png) to embed it as a cover art of an audio file (vorbis, opus, flac).

```sh
# development
pnpm dev
pnpm test
pnpm build
pnpm -s cli < misc/test.jpg
pnpm e2e

# release
pnpm release

# cli
flac-picture < misc/test.jpg
```

## references

- https://wiki.xiph.org/VorbisComment#Cover_art
- https://xiph.org/flac/format.html#metadata_block_picture
- https://gitlab.xiph.org/xiph/libopusenc/-/blob/f51c3aa431c2f0f8fccd8926628b5f330292489f/src/picture.c
- https://github.com/FFmpeg/FFmpeg/blob/81bc4ef14292f77b7dcea01b00e6f2ec1aea4b32/libavformat/flacenc.c#L81
- https://github.com/hi-ogawa/ffmpeg-experiment/pull/4
