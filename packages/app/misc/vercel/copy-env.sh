#!/bin/bash
set -eu -o pipefail

# usage:
#   pnpm dotenv-staging bash misc/vercel/copy-env.sh preview APP_S3_ENDPOINT
#   pnpm dotenv-production bash misc/vercel/copy-env.sh production APP_S3_ENDPOINT

target="$1"
shift

for key in "${@}"; do
  value="${!key:-}"
  if [ -z "${NO_CONFIRM:-}" ]; then
    echo ":: proceed to set '$key'? (y/n)"
    echo "$key=$value"
    read -n 1 -r
    echo
    case "$REPLY" in
      y) ;;
      *)
        echo "skipped ($key)"
        continue
      ;;
    esac
  fi
  echo 'y' | vercel env rm "$key" "$target" || true
  echo -n "$value" | vercel env add "$key" "$target"
done
