# app

```sh
# dev
pnpm dev

# release
pnpm build
pnpm release-production

# run processing as cli
pnpm ts ./src/misc/cli.ts --id https://www.youtube.com/watch?v=fnWoFuh7ZuA \
  --artist "Snarky Puppy" --title "Bet" --out test.opus
```
