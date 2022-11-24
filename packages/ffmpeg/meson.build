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
nlohmann_json_dep = declare_dependency(
  include_directories: include_directories('third_party/json/single_include')
)

#
# libwebm (webm_parser, mkvmuxer) (cf. packages/ffmpeg/third_party/libwebm/CMakeLists.txt)
#
webm_parser_lib = static_library(
  'webm_parser',
  # find third_party/libwebm/webm_parser/src -type f -name '*.cc' | sort | xargs -I @ echo "'@',"
  'third_party/libwebm/webm_parser/src/ancestory.cc',
  'third_party/libwebm/webm_parser/src/bit_utils.cc',
  'third_party/libwebm/webm_parser/src/block_header_parser.cc',
  'third_party/libwebm/webm_parser/src/block_parser.cc',
  'third_party/libwebm/webm_parser/src/buffer_reader.cc',
  'third_party/libwebm/webm_parser/src/callback.cc',
  'third_party/libwebm/webm_parser/src/date_parser.cc',
  'third_party/libwebm/webm_parser/src/file_reader.cc',
  'third_party/libwebm/webm_parser/src/float_parser.cc',
  'third_party/libwebm/webm_parser/src/id_element_parser.cc',
  'third_party/libwebm/webm_parser/src/id_parser.cc',
  'third_party/libwebm/webm_parser/src/istream_reader.cc',
  'third_party/libwebm/webm_parser/src/master_parser.cc',
  'third_party/libwebm/webm_parser/src/parser_utils.cc',
  'third_party/libwebm/webm_parser/src/segment_parser.cc',
  'third_party/libwebm/webm_parser/src/size_parser.cc',
  'third_party/libwebm/webm_parser/src/skip_parser.cc',
  'third_party/libwebm/webm_parser/src/unknown_parser.cc',
  'third_party/libwebm/webm_parser/src/var_int_parser.cc',
  'third_party/libwebm/webm_parser/src/virtual_block_parser.cc',
  'third_party/libwebm/webm_parser/src/void_parser.cc',
  'third_party/libwebm/webm_parser/src/webm_parser.cc',
  include_directories: [
    include_directories('third_party/libwebm/webm_parser/include'),
    include_directories('third_party/libwebm/webm_parser')
  ]
)
webm_parser_dep = declare_dependency(
  link_with: webm_parser_lib,
  include_directories: include_directories('third_party/libwebm/webm_parser/include')
)

mkvmuxer_lib = static_library(
  'mkvmuxer',
  # find third_party/libwebm/mkvmuxer -type f -name '*.cc' | sort | xargs -I @ echo "'@',"
  'third_party/libwebm/mkvmuxer/mkvmuxer.cc',
  'third_party/libwebm/mkvmuxer/mkvmuxerutil.cc',
  'third_party/libwebm/mkvmuxer/mkvwriter.cc',
  include_directories: include_directories('third_party/libwebm')
)
mkvmuxer_dep = declare_dependency(
  link_with: mkvmuxer_lib,
  include_directories: include_directories('third_party/libwebm')
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

executable(
  'ex01',
  'src/cpp/ex01.cpp',
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
    'src/cpp/ex00-emscripten.cpp',
    name_suffix: 'js',
    dependencies: [
      nlohmann_json_dep,
      ffmpeg_dep
    ],
    link_args: emscripten_link_args
  )

  executable(
    'ex01-emscripten',
    'src/cpp/ex01-emscripten.cpp',
    name_suffix: 'js',
    dependencies: [
      nlohmann_json_dep,
      webm_parser_dep,
      mkvmuxer_dep
    ],
    link_args: emscripten_link_args
  )
endif
