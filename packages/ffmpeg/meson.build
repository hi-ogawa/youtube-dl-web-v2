project('@hiogawa/ffmpeg', 'cpp')

# TODO:
# - [x] compile_commands.json
# - [ ] dependency, subproject
#   - [x] json
#   - [x] ffmpeg
#   - [ ] libwebm
# - [ ] emscripten toolchain
# - [ ] ci

#
# ffmpeg (prebuilt beforehand)
#
compiler = meson.get_compiler('cpp')

ffmpeg_libs = []
foreach ffmpeg_lib_name : ['avformat', 'avcodec', 'avutil', 'swresample']
  ffmpeg_libs += compiler.find_library(ffmpeg_lib_name, dirs: meson.current_source_dir() / 'build/native/ffmpeg/prefix/lib')
endforeach

ffmpeg_dep = declare_dependency(
  dependencies: ffmpeg_libs,
  include_directories: include_directories('build/native/ffmpeg/prefix/include'),
)

#
# json https://github.com/nlohmann/json
#
nlohmann_json_dep = declare_dependency(
  include_directories: include_directories('third_party/json/single_include')
)

#
# binary
#
executable(
  'ex00',
  'src/cpp/ex00.cpp',
  dependencies: [
    nlohmann_json_dep,
    ffmpeg_dep
  ]
)
