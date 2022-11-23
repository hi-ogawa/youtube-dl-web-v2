#include <iostream>
#include <nlohmann/json.hpp>
#include <string>
#include <vector>

int main(int argc, const char* argv[]) {
  std::vector<std::string> argv_vector;
  for (int i = 0; i < argc; i++) {
    argv_vector.push_back(std::string(argv[i]));
  }
  auto value = nlohmann::json::object({{"argv", argv_vector}, {"argc", argc}});
  std::cout << value.dump(2) << std::endl;
  return 0;
}
