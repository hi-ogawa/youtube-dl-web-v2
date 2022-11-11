#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <cstring>
#include <optional>
#include "ex00-impl.hpp"
#include "utils.hpp"

using namespace emscripten;

template <typename T>
val vector_view(const std::vector<T>& self) {
  return val(typed_memory_view(self.size(), self.data()));
}

EMSCRIPTEN_BINDINGS(ex_00) {
  register_vector<uint8_t>("embind_Vector")
      .function("view", &vector_view<uint8_t>);
  register_map<std::string, std::string>("embind_StringMap");

  function("embind_convert", &ex00_impl::convert);
}
