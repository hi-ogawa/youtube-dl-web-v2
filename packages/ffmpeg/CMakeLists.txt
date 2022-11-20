cmake_minimum_required(VERSION 3.0.0)
project(youtube-dl-web-v2-ffmpeg LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
add_compile_options(-Wall -Wextra -Wshadow -Wno-missing-braces)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

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

# json https://github.com/nlohmann/json
add_library(json INTERFACE)
target_include_directories(json INTERFACE ${CMAKE_SOURCE_DIR}/third_party/json/single_include)

# libwebm
set(ENABLE_WEBM_PARSER ON CACHE BOOL "")
set(ENABLE_WEBMTS OFF CACHE BOOL "")
set(ENABLE_WEBMINFO OFF CACHE BOOL "")
add_subdirectory(third_party/libwebm)

# binary
add_executable(ex00 src/cpp/ex00.cpp)
target_link_libraries(ex00 ffmpeg json)

add_executable(ex01 src/cpp/ex01.cpp)
target_link_libraries(ex01 webm_parser mkvmuxer json)
include_directories(ex01 SYSTEM third_party/libwebm/webm_parser/include third_party/libwebm) # use SYSTEM to suppress warning

# emscripten binary
get_filename_component(COMPILER_BASENAME "${CMAKE_C_COMPILER}" NAME)
if (COMPILER_BASENAME STREQUAL emcc)
  add_executable(ex00-emscripten src/cpp/ex00-emscripten.cpp)
  target_link_libraries(ex00-emscripten ffmpeg json)
  target_compile_options(ex00-emscripten PRIVATE "SHELL: -fexceptions")
  target_link_options(ex00-emscripten PRIVATE "SHELL: --bind -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 --minify 0")

  add_executable(ex01-emscripten src/cpp/ex01-emscripten.cpp)
  target_link_libraries(ex01-emscripten webm_parser mkvmuxer json)
  include_directories(ex01-emscripten SYSTEM third_party/libwebm/webm_parser/include third_party/libwebm) # use SYSTEM to suppress warning
  target_compile_options(ex01-emscripten PRIVATE "SHELL: -fexceptions")
  target_link_options(ex01-emscripten PRIVATE "SHELL: --bind -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 --minify 0")
endif()
