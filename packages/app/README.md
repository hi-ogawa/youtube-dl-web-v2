# app

```sh
# deploy
vercel --version # Vercel CLI 25.2.3
vercel projects add youtube-dl-web-v2-hiro18181
vercel link -p youtube-dl-web-v2-hiro18181
pnpm build
pnpm release:production

# run processing as cli
pnpm ts ./src/misc/cli.ts --id https://www.youtube.com/watch?v=fnWoFuh7ZuA \
  --artist "Snarky Puppy" --title "Bet" --out test.opus
```
