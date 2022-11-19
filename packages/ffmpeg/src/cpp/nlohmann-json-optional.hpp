#include <nlohmann/json.hpp>
#include <optional>

// https://github.com/nlohmann/json/issues/1749#issuecomment-1099890282
// https://github.com/nlohmann/json/blob/a3e6e26dc83a726b292f5be0492fcc408663ce55/include/nlohmann/detail/macro_scope.hpp#L393-L395

template <typename>
constexpr bool is_optional = false;

template <typename T>
constexpr bool is_optional<std::optional<T>> = true;

template <class T>
void optional_to_json(nlohmann::json& j, const std::optional<T>& v) {
  if (v.has_value()) {
    j = *v;
  } else {
    j = nullptr;
  }
}

template <class T>
void optional_from_json(const nlohmann::json& j, std::optional<T>& v) {
  if (j.is_null()) {
    v = std::nullopt;
  } else {
    v = j.get<T>();
  }
}

template <typename T>
void _to_json(const char* key, nlohmann::json& j, const T& v) {
  if constexpr (is_optional<T>) {
    if (v.has_value()) {
      j[key] = *v;
    } else {
      j[key] = nullptr;
    }
  } else {
    j[key] = v;
  }
}

template <typename T>
void _from_json(const char* key, const nlohmann::json& j, T& v) {
  if constexpr (is_optional<T>) {
    if (j.contains(key)) {
      optional_from_json(j.at(key), v);
    } else {
      v = std::nullopt;
    }
  } else {
    j.at(key).get_to(v);
  }
}

#define OPTIONAL__NLOHMANN_JSON_TO(v1) \
  _to_json(#v1, nlohmann_json_j, nlohmann_json_t.v1);

#define OPTIONAL__NLOHMANN_JSON_FROM(v1) \
  _from_json(#v1, nlohmann_json_j, nlohmann_json_t.v1);

#define OPTIONAL__NLOHMANN_DEFINE_TYPE(Type, ...)                       \
  friend void to_json(nlohmann::json& nlohmann_json_j,                  \
                      const Type& nlohmann_json_t) {                    \
    NLOHMANN_JSON_EXPAND(                                               \
        NLOHMANN_JSON_PASTE(OPTIONAL__NLOHMANN_JSON_TO, __VA_ARGS__))   \
  }                                                                     \
                                                                        \
  friend void from_json(const nlohmann::json& nlohmann_json_j,          \
                        Type& nlohmann_json_t) {                        \
    NLOHMANN_JSON_EXPAND(                                               \
        NLOHMANN_JSON_PASTE(OPTIONAL__NLOHMANN_JSON_FROM, __VA_ARGS__)) \
  }
