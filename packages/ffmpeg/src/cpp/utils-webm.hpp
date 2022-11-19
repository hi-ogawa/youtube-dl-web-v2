#include <webm/buffer_reader.h>
#include <webm/webm_parser.h>
#include <optional>
#include <vector>
#include "nlohmann-json-optional.hpp"
#include "utils.hpp"

// cf.
// - packages/ffmpeg/third_party/libwebm/webm_parser/demo/demo.cc
// - packages/ffmpeg/third_party/libwebm/webm_parser/README.md

namespace utils_webm {

//
// simple structs
//

// https://stackoverflow.com/a/11421471
template <typename EnumClass>
auto to_underlying_type(const EnumClass& v) {
  return static_cast<std::underlying_type_t<EnumClass>>(v);
}

struct SimpleTrackEntry {
  std::optional<std::uint64_t> track_number;
  std::optional<std::uint64_t> track_type;
  std::optional<std::string> codec_id;

  static SimpleTrackEntry fromWebm(const webm::TrackEntry& w) {
    SimpleTrackEntry res;
    if (w.track_number.is_present()) {
      res.track_number = w.track_number.value();
    }
    if (w.track_type.is_present()) {
      res.track_type = to_underlying_type(w.track_type.value());
    }
    if (w.codec_id.is_present()) {
      res.codec_id = w.codec_id.value();
    }
    return res;
  }

  OPTIONAL__NLOHMANN_DEFINE_TYPE(SimpleTrackEntry,
                                 track_number,
                                 track_type,
                                 codec_id);
};

struct SimpleCuePoint {
  std::optional<std::uint64_t> time;
  std::optional<std::uint64_t> track;
  std::optional<std::uint64_t> duration;
  std::optional<std::uint64_t> cluster_position;

  static SimpleCuePoint fromWebm(const webm::CuePoint& w) {
    SimpleCuePoint res;
    if (w.time.is_present()) {
      res.time = w.time.value();
    }
    for (auto wp : w.cue_track_positions) {
      if (wp.is_present()) {
        auto v = wp.value();
        if (v.track.is_present()) {
          res.track = v.track.value();
        }
        if (v.duration.is_present()) {
          res.duration = v.duration.value();
        }
        if (v.cluster_position.is_present()) {
          res.cluster_position = v.cluster_position.value();
        }
      }
    }
    return res;
  }

  OPTIONAL__NLOHMANN_DEFINE_TYPE(SimpleCuePoint,
                                 time,
                                 track,
                                 duration,
                                 cluster_position);
};

struct SimpleMetadata {
  std::optional<std::string> ebml_doc_type;

  // CueClusterPosition is relative to position
  std::optional<std::uint64_t> segment_body_start;

  std::vector<SimpleTrackEntry> track_entries;

  std::vector<SimpleCuePoint> cue_points;

  // serializable to nlohmann::json for quick debugging
  OPTIONAL__NLOHMANN_DEFINE_TYPE(SimpleMetadata,
                                 ebml_doc_type,
                                 segment_body_start,
                                 track_entries,
                                 cue_points);
};

//
// custom webm::Callback
//

// collect everything except Cluster
struct MetadataParserCallback : webm::Callback {
  SimpleMetadata metadata_;

  webm::Status OnEbml(const webm::ElementMetadata&,
                      const webm::Ebml& ebml) override {
    ASSERT(ebml.doc_type.is_present());
    ASSERT(!metadata_.ebml_doc_type.has_value());
    metadata_.ebml_doc_type = ebml.doc_type.value();
    return webm::Status(webm::Status::kOkCompleted);
  }

  webm::Status OnSegmentBegin(const webm::ElementMetadata& metadata,
                              webm::Action* action) override {
    ASSERT(!metadata_.segment_body_start.has_value());
    metadata_.segment_body_start = metadata.position + metadata.header_size;
    *action = webm::Action::kRead;
    return webm::Status(webm::Status::kOkCompleted);
  }

  webm::Status OnTrackEntry(const webm::ElementMetadata&,
                            const webm::TrackEntry& track_entry) override {
    metadata_.track_entries.push_back(SimpleTrackEntry::fromWebm(track_entry));
    return webm::Status(webm::Status::kOkCompleted);
  }

  webm::Status OnCuePoint(const webm::ElementMetadata&,
                          const webm::CuePoint& cue_point) override {
    metadata_.cue_points.push_back(SimpleCuePoint::fromWebm(cue_point));
    return webm::Status(webm::Status::kOkCompleted);
  }

  webm::Status OnElementBegin(const webm::ElementMetadata& metadata,
                              webm::Action* action) override {
    // stop once "Cluster" is found
    if (metadata.id == webm::Id::kCluster) {
      *action = webm::Action::kSkip;
      return webm::Status(webm::Status::kEndOfFile);
    }
    *action = webm::Action::kRead;
    return webm::Status(webm::Status::kOkCompleted);
  }
};

//
// read metadata from buffer
//

std::pair<webm::Status, SimpleMetadata> parseMetadata(
    const std::vector<uint8_t>& buffer) {
  MetadataParserCallback callback;
  webm::WebmParser parser;
  webm::BufferReader reader(buffer);
  auto status = parser.Feed(&callback, &reader);
  return std::make_pair(status, callback.metadata_);
}

}  // namespace utils_webm
