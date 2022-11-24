project('@hiogawa/ffmpeg', 'cpp')

compiler = meson.get_compiler('cpp')
is_emscripten = compiler.get_id() == 'emscripten'

#
# ffmpeg (prebuilt beforehand)
#
if is_emscripten
  ffmpeg_prefix = 'build/emscripten/ffmpeg/prefix'
else
  ffmpeg_prefix = 'build/native/ffmpeg/prefix'
endif

ffmpeg_libs = []
foreach ffmpeg_lib_name : ['avformat', 'avcodec', 'avutil', 'swresample']
  ffmpeg_libs += compiler.find_library(ffmpeg_lib_name, dirs: meson.current_source_dir() / ffmpeg_prefix / 'lib')
endforeach

ffmpeg_dep = declare_dependency(
  dependencies: ffmpeg_libs,
  include_directories: include_directories(ffmpeg_prefix / 'include'),
)

#
# json https://github.com/nlohmann/json
#
nlohmann_json_project = subproject('nlohmann_json')
nlohmann_json_dep = nlohmann_json_project.get_variable('nlohmann_json_dep')

#
# libwebm (for webm_parser and mkvmuxer)
#
libwebm_project = subproject('libwebm')
webm_parser_dep = libwebm_project.get_variable('webm_parser_dep')
mkvmuxer_dep = libwebm_project.get_variable('mkvmuxer_dep')

#
# binary
#

# prepending `meson.current_source_dir()` so that __FILE__ macro gives absolute path
executable(
  'ex00',
  meson.current_source_dir() / 'src/cpp/ex00.cpp',
  dependencies: [
    nlohmann_json_dep,
    ffmpeg_dep
  ]
)

executable(
  'ex01',
  meson.current_source_dir() / 'src/cpp/ex01.cpp',
  dependencies: [
    nlohmann_json_dep,
    webm_parser_dep,
    mkvmuxer_dep
  ]
)

if is_emscripten
  emscripten_link_args = ['--bind', '-s', 'ALLOW_MEMORY_GROWTH=1', '-s', 'MODULARIZE=1', '--minify', '0']

  executable(
    'ex00-emscripten',
    meson.current_source_dir() / 'src/cpp/ex00-emscripten.cpp',
    name_suffix: 'js',
    dependencies: [
      nlohmann_json_dep,
      ffmpeg_dep
    ],
    link_args: emscripten_link_args
  )

  executable(
    'ex01-emscripten',
    meson.current_source_dir() / 'src/cpp/ex01-emscripten.cpp',
    name_suffix: 'js',
    dependencies: [
      nlohmann_json_dep,
      webm_parser_dep,
      mkvmuxer_dep
    ],
    link_args: emscripten_link_args
  )
endif
