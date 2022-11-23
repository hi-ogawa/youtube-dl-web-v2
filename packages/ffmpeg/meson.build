project('@hiogawa/ffmpeg', 'cpp')

# TODO:
# - [x] compile_commands.json
# - [x] dependency, subproject
#   - [x] json
#   - [x] ffmpeg
#   - [x] libwebm
# - [x] emscripten toolchain
# - [ ] ci
# - [ ] sanitizer
# - [ ] __FILE__ macro absolute path (ninja issue?)

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
  # generated via
  #   find third_party/libwebm/webm_parser/src -type f | xargs -I @ echo "'@'" | tr '\n' ','
  'third_party/libwebm/webm_parser/src/var_int_parser.cc','third_party/libwebm/webm_parser/src/id_parser.h','third_party/libwebm/webm_parser/src/float_parser.cc','third_party/libwebm/webm_parser/src/block_parser.h','third_party/libwebm/webm_parser/src/chapter_display_parser.h','third_party/libwebm/webm_parser/src/webm_parser.cc','third_party/libwebm/webm_parser/src/chapter_atom_parser.h','third_party/libwebm/webm_parser/src/block_parser.cc','third_party/libwebm/webm_parser/src/audio_parser.h','third_party/libwebm/webm_parser/src/cue_point_parser.h','third_party/libwebm/webm_parser/src/float_parser.h','third_party/libwebm/webm_parser/src/segment_parser.h','third_party/libwebm/webm_parser/src/seek_head_parser.h','third_party/libwebm/webm_parser/src/buffer_reader.cc','third_party/libwebm/webm_parser/src/skip_callback.h','third_party/libwebm/webm_parser/src/mastering_metadata_parser.h','third_party/libwebm/webm_parser/src/void_parser.h','third_party/libwebm/webm_parser/src/parser.h','third_party/libwebm/webm_parser/src/track_entry_parser.h','third_party/libwebm/webm_parser/src/block_additions_parser.h','third_party/libwebm/webm_parser/src/skip_parser.h','third_party/libwebm/webm_parser/src/skip_parser.cc','third_party/libwebm/webm_parser/src/file_reader.cc','third_party/libwebm/webm_parser/src/bit_utils.cc','third_party/libwebm/webm_parser/src/element_parser.h','third_party/libwebm/webm_parser/src/bool_parser.h','third_party/libwebm/webm_parser/src/ebml_parser.h','third_party/libwebm/webm_parser/src/info_parser.h','third_party/libwebm/webm_parser/src/id_parser.cc','third_party/libwebm/webm_parser/src/void_parser.cc','third_party/libwebm/webm_parser/src/var_int_parser.h','third_party/libwebm/webm_parser/src/size_parser.cc','third_party/libwebm/webm_parser/src/master_value_parser.h','third_party/libwebm/webm_parser/src/tracks_parser.h','third_party/libwebm/webm_parser/src/chapters_parser.h','third_party/libwebm/webm_parser/src/targets_parser.h','third_party/libwebm/webm_parser/src/tags_parser.h','third_party/libwebm/webm_parser/src/ancestory.h','third_party/libwebm/webm_parser/src/int_parser.h','third_party/libwebm/webm_parser/src/time_slice_parser.h','third_party/libwebm/webm_parser/src/cue_track_positions_parser.h','third_party/libwebm/webm_parser/src/parser_utils.h','third_party/libwebm/webm_parser/src/bit_utils.h','third_party/libwebm/webm_parser/src/colour_parser.h','third_party/libwebm/webm_parser/src/parser_utils.cc','third_party/libwebm/webm_parser/src/simple_tag_parser.h','third_party/libwebm/webm_parser/src/master_parser.cc','third_party/libwebm/webm_parser/src/virtual_block_parser.h','third_party/libwebm/webm_parser/src/cues_parser.h','third_party/libwebm/webm_parser/src/slices_parser.h','third_party/libwebm/webm_parser/src/block_header_parser.cc','third_party/libwebm/webm_parser/src/content_encryption_parser.h','third_party/libwebm/webm_parser/src/istream_reader.cc','third_party/libwebm/webm_parser/src/unknown_parser.cc','third_party/libwebm/webm_parser/src/date_parser.cc','third_party/libwebm/webm_parser/src/segment_parser.cc','third_party/libwebm/webm_parser/src/content_enc_aes_settings_parser.h','third_party/libwebm/webm_parser/src/recursive_parser.h','third_party/libwebm/webm_parser/src/ancestory.cc','third_party/libwebm/webm_parser/src/content_encoding_parser.h','third_party/libwebm/webm_parser/src/date_parser.h','third_party/libwebm/webm_parser/src/block_header_parser.h','third_party/libwebm/webm_parser/src/block_group_parser.h','third_party/libwebm/webm_parser/src/video_parser.h','third_party/libwebm/webm_parser/src/byte_parser.h','third_party/libwebm/webm_parser/src/id_element_parser.h','third_party/libwebm/webm_parser/src/size_parser.h','third_party/libwebm/webm_parser/src/projection_parser.h','third_party/libwebm/webm_parser/src/content_encodings_parser.h','third_party/libwebm/webm_parser/src/id_element_parser.cc','third_party/libwebm/webm_parser/src/master_parser.h','third_party/libwebm/webm_parser/src/virtual_block_parser.cc','third_party/libwebm/webm_parser/src/edition_entry_parser.h','third_party/libwebm/webm_parser/src/unknown_parser.h','third_party/libwebm/webm_parser/src/seek_parser.h','third_party/libwebm/webm_parser/src/block_more_parser.h','third_party/libwebm/webm_parser/src/tag_parser.h','third_party/libwebm/webm_parser/src/callback.cc','third_party/libwebm/webm_parser/src/cluster_parser.h',
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
