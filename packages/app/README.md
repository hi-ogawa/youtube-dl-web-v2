# app

```sh
# deploy
vercel --version # Vercel CLI 25.2.3
vercel projects add ffmpeg-experiment-hiro18181
vercel link -p ffmpeg-experiment-hiro18181
pnpm build
pnpm release:production
```
