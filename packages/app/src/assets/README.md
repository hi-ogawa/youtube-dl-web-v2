# assets

```bash
# download the original svg from https://feathericons.com/
wget https://raw.githubusercontent.com/feathericons/feather/master/icons/youtube.svg -O packages/app/src/assets/icon.svg

# convert to png with different sizes
for px in 32 192 512; do
  convert -density 1000 -resize "${px}x${px}" -background none packages/app/src/assets/original.svg "packages/app/src/assets/icon-${px}.png"
done
```
