#!/bin/bash

echo ":: [configure]"
cmake . -B build/emscripten/Release -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake

echo ":: [build]"
cmake --build build/emscripten/Release
