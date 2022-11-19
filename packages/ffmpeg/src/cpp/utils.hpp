#pragma once

#include <cstdio>
#include <fstream>
#include <iostream>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <string>
#include <tuple>
#include <vector>

//
// assertion
//

#define ASSERT(EXPR)                                                \
  if (!static_cast<bool>(EXPR)) {                                   \
    std::ostringstream ostream;                                     \
    ostream << "[" << __FILE__ << ":" << __LINE__ << "] " << #EXPR; \
    throw std::runtime_error{ostream.str()};                        \
  }

//
// debug print
//

#define dbg(...)                                                   \
  do {                                                             \
    std::cerr << #__VA_ARGS__ ": " << std::make_tuple(__VA_ARGS__) \
              << std::endl;                                        \
  } while (0)

//
// stdlib container pretty print
//
namespace std {

// std::tuple
template <class... Ts>
ostream& operator<<(ostream& ostr, const tuple<Ts...>& xs) {
  ostr << "(";
  bool sep = false;
  apply(
      [&](auto&&... x) { ((ostr << (sep ? ", " : "") << x, sep = true), ...); },
      xs);
  return ostr << ")";
}

// std::pair
template <class T1, class T2>
ostream& operator<<(ostream& ostr, const pair<T1, T2>& x) {
  return ostr << tie(x.first, x.second);
}

template <class T>
ostream& operator<<(ostream& ostr, const optional<T>& x) {
  if (x.has_value()) {
    return ostr << "{" << x.value() << "}";
  }
  return ostr << "null";
}

// "container" except std::string
template <class T,
          class = decltype(begin(declval<T>())),
          class = enable_if_t<!is_same<T, string>::value>>
ostream& operator<<(ostream& ostr, const T& xs) {
  ostr << "{";
  bool sep = false;
  for (auto& x : xs) {
    ostr << (sep ? ", " : "") << x;
    sep = true;
  }
  return ostr << "}";
}

}  // namespace std

namespace utils {

//
// file io
//

std::vector<uint8_t> readFile(const std::string& filename) {
  std::ifstream istr(filename, std::ios::binary);
  ASSERT(istr.is_open());
  std::vector<uint8_t> data((std::istreambuf_iterator<char>(istr)),
                            std::istreambuf_iterator<char>());
  return data;
}

void writeFile(const std::string& filename, const std::vector<uint8_t>& data) {
  std::ofstream ostr(filename, std::ios::binary);
  ASSERT(ostr.is_open());
  ostr.write(reinterpret_cast<const char*>(data.data()), data.size());
}

//
// cli
//

struct Cli {
  const int argc;
  const char** argv;

  template <typename T>
  T parse(const char* s) {
    if constexpr (std::is_same_v<T, std::string>) {
      return std::string{s};
    } else {
      std::istringstream stream{s};
      T result;
      stream >> result;
      return result;
    }
  }

  template <typename T = std::string>
  std::optional<T> argument(const std::string& flag) {
    for (auto i = 1; i < argc; i++) {
      if (argv[i] == flag && i + 1 < argc) {
        return std::optional{parse<T>(argv[i + 1])};
      }
    }
    return {};
  }
};

//
// subprocess
//

std::vector<uint8_t> readFileDescriptor(std::FILE* fp) {
  std::vector<std::vector<uint8_t>> chunks;
  constexpr size_t CHUNK_SIZE = 1 << 10;
  while (true) {
    auto& chunk = chunks.emplace_back();
    chunk.resize(CHUNK_SIZE);
    auto read_size = std::fread(chunk.data(), sizeof(uint8_t), CHUNK_SIZE, fp);
    if (read_size < CHUNK_SIZE) {
      chunk.resize(read_size);
      break;
    }
  }
  ASSERT(std::feof(fp));

  std::vector<uint8_t> output;
  for (auto& chunk : chunks) {
    output.insert(output.end(), chunk.begin(), chunk.end());
  }
  return output;
}

struct Subprocess {
  // https://docs.python.org/3/library/subprocess.html#subprocess.check_output
  // https://pubs.opengroup.org/onlinepubs/009696799/functions/popen.html
  static std::vector<uint8_t> checkOutput(const std::string& command) {
    std::FILE* fp = popen(command.c_str(), "r");
    ASSERT(fp);
    auto output = readFileDescriptor(fp);
    int status = pclose(fp);
    ASSERT(status != -1);
    return output;
  }
};

//
// RAII wrapper (cf. https://stackoverflow.com/a/42060129)
//

template <class F>
struct defer {
  F f;
  ~defer() { f(); }
};

struct defer_helper {
  template <class F>
  defer<F> operator*=(F f) {
    return {f};
  }
};

#define _DEFER_VAR2(x) _defer_var_##x
#define _DEFER_VAR1(x) _DEFER_VAR2(x)
#define DEFER auto _DEFER_VAR1(__LINE__) = ::utils::defer_helper{} *= [&]()

//
// hex print
//

constexpr char HEX_TABLE[] = {'0', '1', '2', '3', '4', '5', '6', '7',
                              '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};

std::string to_hex(uint8_t x) {
  std::string res;
  res += HEX_TABLE[(x >> 4) & 0xf];
  res += HEX_TABLE[x & 0xf];
  return res;
}

}  // namespace utils
