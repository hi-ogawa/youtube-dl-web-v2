project('libwebm', 'cpp')

# based on subprojects/libwebm/CMakeLists.txt

#
# webm_parser
#

webm_parser_lib = static_library(
  'webm_parser',
  # find subprojects/libwebm/webm_parser/src -type f -name '*.cc' | sort | xargs -I @ echo "'@',"
  'webm_parser/src/ancestory.cc',
  'webm_parser/src/bit_utils.cc',
  'webm_parser/src/block_header_parser.cc',
  'webm_parser/src/block_parser.cc',
  'webm_parser/src/buffer_reader.cc',
  'webm_parser/src/callback.cc',
  'webm_parser/src/date_parser.cc',
  'webm_parser/src/file_reader.cc',
  'webm_parser/src/float_parser.cc',
  'webm_parser/src/id_element_parser.cc',
  'webm_parser/src/id_parser.cc',
  'webm_parser/src/istream_reader.cc',
  'webm_parser/src/master_parser.cc',
  'webm_parser/src/parser_utils.cc',
  'webm_parser/src/segment_parser.cc',
  'webm_parser/src/size_parser.cc',
  'webm_parser/src/skip_parser.cc',
  'webm_parser/src/unknown_parser.cc',
  'webm_parser/src/var_int_parser.cc',
  'webm_parser/src/virtual_block_parser.cc',
  'webm_parser/src/void_parser.cc',
  'webm_parser/src/webm_parser.cc',
  include_directories: [
    include_directories('webm_parser/include'),
    include_directories('webm_parser')
  ]
)

webm_parser_dep = declare_dependency(
  link_with: webm_parser_lib,
  include_directories: include_directories('webm_parser/include')
)

#
# mkvmuxer
#

mkvmuxer_lib = static_library(
  'mkvmuxer',
  # find subprojects/libwebm/mkvmuxer -type f -name '*.cc' | sort | xargs -I @ echo "'@',"
  'mkvmuxer/mkvmuxer.cc',
  'mkvmuxer/mkvmuxerutil.cc',
  'mkvmuxer/mkvwriter.cc',
  include_directories: include_directories('.')
)

mkvmuxer_dep = declare_dependency(
  link_with: mkvmuxer_lib,
  include_directories: include_directories('.')
)
