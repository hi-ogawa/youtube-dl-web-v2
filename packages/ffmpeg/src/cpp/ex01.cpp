#include <cstring>
#include <optional>
#include "utils-webm.hpp"
#include "utils.hpp"

int main(int argc, const char* argv[]) {
  utils::Cli cli{argc, argv};
  auto in_file = cli.argument<std::string>("--in");
  auto slice = cli.argument<size_t>("--slice");
  ASSERT(in_file);

  auto webmData = utils::readFile(in_file.value());
  if (slice) {
    // test if metadata can be parsed properly with incomplete data
    webmData.resize(slice.value());
  }
  auto [status, metadata] = utils_webm::parseMetadata(webmData);
  dbg(status.code, status.completed_ok());
  dbg(nlohmann::json(metadata).dump(2));

  return 0;
}
