# worker

it seems vite cannot bundle emscripten module built with PROXY_TO_PTHREAD by `?worker` import (possibly due to esm worker).
so, we just transpile `src/worker/ffmpeg.ts` separately and use it by `?url` import.
