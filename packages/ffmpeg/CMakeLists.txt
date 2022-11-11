cmake_minimum_required(VERSION 3.0.0)
project(youtube-dl-web-v2-ffmpeg LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
add_compile_options(-Wall -Wextra -Wshadow -Wno-missing-braces)

# sanitizer
if (CMAKE_BUILD_TYPE STREQUAL Debug)
  add_compile_options(-fsanitize=address -fsanitize=undefined)
  add_link_options(-fsanitize=address -fsanitize=undefined)
endif()

# ffmpeg
set(FFMPEG_PREFIX_DIR "${CMAKE_BINARY_DIR}/../ffmpeg/prefix" CACHE PATH "ffmepg --prefix directory")
add_library(ffmpeg INTERFACE)
target_link_libraries(ffmpeg INTERFACE -L${FFMPEG_PREFIX_DIR}/lib -lavformat -lavcodec -lavutil -lswresample)
target_include_directories(ffmpeg INTERFACE ${FFMPEG_PREFIX_DIR}/include)

# binary
add_executable(ex00 src/cpp/ex00.cpp)
target_link_libraries(ex00 ffmpeg)

# emscripten binary
get_filename_component(COMPILER_BASENAME "${CMAKE_C_COMPILER}" NAME)
if (COMPILER_BASENAME STREQUAL emcc)
  add_executable(ex00-emscripten src/cpp/ex00-emscripten.cpp)
  target_link_libraries(ex00-emscripten ffmpeg)
  target_compile_options(ex00-emscripten PRIVATE "SHELL: -fexceptions")
  target_link_options(ex00-emscripten PRIVATE "SHELL: --bind -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 --minify 0")
endif()
