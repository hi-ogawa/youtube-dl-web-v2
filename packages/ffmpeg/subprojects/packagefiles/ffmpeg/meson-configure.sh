#!/bin/bash
set -eu -o pipefail

source_dir="$1"
build_dir="$2"
shift 2

mkdir -p "$build_dir"
cd "$build_dir"
"$source_dir/configure" "${@}"
touch dummy.txt
