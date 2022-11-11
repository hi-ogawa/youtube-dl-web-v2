#include <cstring>
#include <optional>
#include "ex00-impl.hpp"
#include "utils.hpp"

int main(int argc, const char** argv) {
  // parse arguments
  utils::Cli cli{argc, argv};
  auto in_file = cli.argument<std::string>("--in");
  auto out_file = cli.argument<std::string>("--out");
  auto start_time = cli.argument<double>("--start-time").value_or(-1);
  auto end_time = cli.argument<double>("--end-time").value_or(-1);
  if (!in_file || !out_file) {
    std::cout << cli.help() << std::endl;
    return 1;
  }

  // read data
  auto in_data = utils::readFile(in_file.value());

  // process
  auto output = ex00_impl::convert(in_data, "opus", start_time, end_time);

  // write data
  utils::writeFile(out_file.value(), output);
}
