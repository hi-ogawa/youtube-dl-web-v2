#include <cstring>
#include <optional>
#include "utils-webm.hpp"
#include "utils.hpp"

int mainParseMetadata(int argc, const char* argv[]) {
  utils::Cli cli{argc, argv};
  auto in_file = cli.argument<std::string>("--in");
  auto slice = cli.argument<size_t>("--slice");
  ASSERT(in_file);

  auto webmData = utils::readFile(in_file.value());
  if (slice) {
    // test if metadata can be parsed properly with incomplete data
    webmData = std::vector(webmData.begin(), webmData.begin() + slice.value());
  }
  auto [status, metadata] = utils_webm::parseMetadata(webmData);
  dbg(status.code, status.completed_ok());
  std::cout << nlohmann::json(metadata).dump(2) << std::endl;
  return 0;
}

int mainParseFrames(int argc, const char* argv[]) {
  utils::Cli cli{argc, argv};
  auto in_file = cli.argument<std::string>("--in");
  auto slice_start = cli.argument<size_t>("--slice-start");
  auto slice_end = cli.argument<size_t>("--slice-end");
  ASSERT(in_file);

  auto webmData = utils::readFile(in_file.value());
  auto begin = webmData.begin();
  auto end = webmData.end();
  if (slice_end) {
    end = begin + slice_end.value();
  }
  if (slice_start) {
    begin += slice_start.value();
  }
  webmData = std::vector(begin, end);
  auto [status, frames] = utils_webm::parseFrames(webmData);
  dbg(status.code, status.completed_ok());
  dbg(frames.size());

  return 0;
}

int main(int argc, const char* argv[]) {
  ASSERT(argc >= 2);
  std::string command(argv[1]);
  if (command == "parse-metadata") {
    return mainParseMetadata(argc, argv);
  }
  if (command == "parse-frames") {
    return mainParseFrames(argc, argv);
  }
  return 1;
}
