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

- bulk download via cli

```sh
# list file names
find ~/Downloads/Download -type f | perl -lne '/([^\/]+)\.\w+$/ && print "$1"' | sort -u > titles.txt

# search video
cat titles.txt | while read -r title; do
  echo "# $title"
  pnpm -s ts ./src/misc/search-video "$title" | \
    jq '.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents | .[] | .videoRenderer | { id: .videoId, title: .title.accessibility.accessibilityData.label, artist: "" } | select(.id)' | \
      jq -s -c '.[0:5] | .[]'
done | tee videos.txt

# manually pick and update the metadata
cp videos.txt videos.final.txt

# download the final video list
mkdir -p misc/data
grep -v '^#' videos.final.txt | while read -r line; do
  id="$(echo "$line" | jq -r '.id')"
  title="$(echo "$line" | jq -r '.title')"
  artist="$(echo "$line" | jq -r '.artist')"
  filename="$artist - $title.opus"
  filename="${filename//\//\\/}"
  echo "::"
  echo ":: $filename"
  echo "::"
  pnpm -s ts ./src/misc/cli.ts --id "$id" --artist "$artist" --title "$title" --out "misc/data/$filename"
done
```
