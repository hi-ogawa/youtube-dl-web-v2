project('ffmpeg', 'cpp')

# simple wrapper for configure/make as custom target
# thus this is not actual incremental build system

# TODO: how to refer to the built artifact (e.g. prefix/lib/libavformat.a)?
# TODO: can we separate configure/make phases?
dummy = custom_target(
  'ffmpeg',
  output: ['dummy.txt'],
  command: [
    'bash',
    meson.current_source_dir() / 'meson-configure.sh',
    meson.current_source_dir(),
    meson.current_build_dir(),
    '--prefix=' + meson.current_build_dir() / 'prefix',
    '--disable-autodetect', '--disable-everything', '--disable-asm', '--disable-doc'
  ],
)

avformat_lib = custom_target(
  'ffmpeg-avformat',
  input: dummy,
  output: 'libavformat.a',
  command: ['cp', '-f', meson.current_build_dir() / 'prefix/lib/libavformat.a', 'libavformat.a']
)


ffmpeg_dep = declare_dependency(
  dependencies: [avformat_lib],
  include_directories: include_directories(meson.current_build_dir() / 'prefix/include'),
)
