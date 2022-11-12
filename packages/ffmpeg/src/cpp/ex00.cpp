#include <cstring>
#include <optional>
#include "ex00-impl.hpp"
#include "utils.hpp"

int mainConvert(utils::Cli& cli) {
  auto in_file = cli.argument<std::string>("--in");
  auto out_file = cli.argument<std::string>("--out");
  auto title = cli.argument<std::string>("--title");
  auto artist = cli.argument<std::string>("--artist");
  auto start_time = cli.argument<double>("--start-time").value_or(-1);
  auto end_time = cli.argument<double>("--end-time").value_or(-1);
  ASSERT(in_file && out_file);

  // read data
  auto in_data = utils::readFile(in_file.value());

  // metadata
  std::map<std::string, std::string> metadata;
  if (title) {
    metadata["title"] = title.value();
  }
  if (artist) {
    metadata["artist"] = artist.value();
  }

  // process
  auto output =
      ex00_impl::convert(in_data, "opus", metadata, start_time, end_time);

  // write data
  utils::writeFile(out_file.value(), output);
  return 0;
}

int mainExtractMetadata(utils::Cli& cli) {
  auto in_file = cli.argument<std::string>("--in");
  ASSERT(in_file);

  // read data
  auto in_data = utils::readFile(in_file.value());

  // process
  auto metadata = ex00_impl::extractMetadata(in_data);
  std::cout << metadata << std::endl;
  return 0;
}

int main(int argc, const char* argv[]) {
  utils::Cli cli{argc, argv};
  ASSERT(argc >= 2);
  std::string command(argv[1]);
  if (command == "convert") {
    return mainConvert(cli);
  }
  if (command == "extract-metadata") {
    return mainExtractMetadata(cli);
  }
  return -1;
}
