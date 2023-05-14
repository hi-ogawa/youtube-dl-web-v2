#!/bin/bash

# based on https://stackoverflow.com/questions/19331497/set-environment-variables-from-file-of-key-value-pairs

# usage:
#   bash misc/dotenv.sh [dotenv-file] [command...]

dotenv_file="$1"
shift

# shellcheck disable=SC2046
env $(grep -v '^#' "$dotenv_file") "${@}"
