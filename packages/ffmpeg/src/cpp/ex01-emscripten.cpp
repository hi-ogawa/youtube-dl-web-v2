#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "utils-webm.hpp"

using namespace emscripten;

template <typename T>
val vector_view(const std::vector<T>& self) {
  return val(typed_memory_view(self.size(), self.data()));
}

EMSCRIPTEN_BINDINGS(ex01) {
  register_vector<uint8_t>("embind_Vector")
      .function("view", &vector_view<uint8_t>);

  function("embind_parseMetadataWrapper", &utils_webm::parseMetadataWrapper);
  function("embind_remuxWrapper", &utils_webm::remuxWrapper);
}
