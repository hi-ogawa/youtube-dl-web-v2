#include <webm/buffer_reader.h>
#include <webm/webm_parser.h>
#include <optional>
#include <vector>
#include "nlohmann-json-optional.hpp"
#include "utils.hpp"

// cf. packages/ffmpeg/third_party/libwebm/webm_parser/demo/demo.cc

namespace utils_webm {

struct Metadata {
  std::optional<std::string> ebml_doc_type;
  std::optional<std::uint64_t>
      segment_body_start;  // CueClusterPosition is relative to position

  OPTIONAL__NLOHMANN_DEFINE_TYPE(Metadata, ebml_doc_type, segment_body_start);
};

// TODO: can callback abort in the middle? (e.g. to stop parsing before Cluster)
struct MetadataParserCallback : webm::Callback {
  Metadata metadata_;

  webm::Status OnEbml(const webm::ElementMetadata&,
                      const webm::Ebml& ebml) override {
    ASSERT(ebml.doc_type.is_present());
    metadata_.ebml_doc_type = ebml.doc_type.value();
    return webm::Status(webm::Status::kOkCompleted);
  }

  webm::Status OnSegmentBegin(const webm::ElementMetadata& metadata,
                              webm::Action* action) override {
    metadata_.segment_body_start = metadata.position + metadata.header_size;
    *action = webm::Action::kRead;
    return webm::Status(webm::Status::kOkCompleted);
  }
};

std::vector<std::string> parseMetadata(const std::vector<uint8_t>& buffer) {
  MetadataParserCallback callback;
  webm::WebmParser parser;
  webm::BufferReader reader(buffer);
  auto status = parser.Feed(&callback, &reader);
  dbg(status.code, status.completed_ok());
  dbg(nlohmann::json(callback.metadata_).dump(2));
  return {};
}

}  // namespace utils_webm
