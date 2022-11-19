#include <cstring>
#include <optional>
#include "utils-webm.hpp"
#include "utils.hpp"

int main(int argc, const char* argv[]) {
  utils::Cli cli{argc, argv};
  auto in_file = cli.argument<std::string>("--in");
  ASSERT(in_file);

  auto webmData = utils::readFile(in_file.value());
  auto cues = utils_webm::parseMetadata(webmData);
  dbg(cues);

  return -1;
}
