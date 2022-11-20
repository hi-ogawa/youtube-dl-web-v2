#include <mkvmuxer/mkvmuxer.h>
#include <mkvmuxer/mkvwriter.h>
#include <webm/buffer_reader.h>
#include <webm/webm_parser.h>
#include <optional>
#include <vector>
#include "nlohmann-json-optional.hpp"
#include "utils.hpp"

// cf.
// - packages/ffmpeg/third_party/libwebm/webm_parser/demo/demo.cc
// - packages/ffmpeg/third_party/libwebm/webm_parser/README.md
// - packages/ffmpeg/third_party/libwebm/mkvmuxer_sample.cc

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
  std::optional<uint64_t> track_number;
  std::optional<uint64_t> track_type;
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
  std::optional<uint64_t> time;
  std::optional<uint64_t> track;
  std::optional<uint64_t> duration;
  std::optional<uint64_t> cluster_position;

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
  std::optional<uint64_t> segment_body_start;

  // Info element
  uint64_t timecode_scale;
  double duration;

  std::vector<SimpleTrackEntry> track_entries;

  std::vector<SimpleCuePoint> cue_points;

  // serializable to nlohmann::json for quick debugging
  OPTIONAL__NLOHMANN_DEFINE_TYPE(SimpleMetadata,
                                 ebml_doc_type,
                                 timecode_scale,
                                 duration,
                                 segment_body_start,
                                 track_entries,
                                 cue_points);
};

struct SimpleFrame {
  uint64_t track_number;
  uint64_t timecode;
  std::vector<uint8_t> data;
};

//
// in-memory mkvmuxer writier
//

struct MkvBufferWriter : mkvmuxer::IMkvWriter {
  std::vector<uint8_t> data_ = {};
  size_t position_ = 0;

  //
  // override
  //

  mkvmuxer::int64 Position() const override {
    return (mkvmuxer::int64)position_;
  };

  mkvmuxer::int32 Position(mkvmuxer::int64 position) override {
    position_ = (mkvmuxer::int32)position;
    return 0;
  }

  bool Seekable() const override { return true; }

  mkvmuxer::int32 Write(const void* buffer, mkvmuxer::uint32 length) override {
    position_ += (size_t)length;
    if (position_ > data_.size()) {
      data_.resize(position_);
    }
    std::memcpy(&data_[position_ - (size_t)length], buffer, length);
    return 0;
  }

  void ElementStartNotify(mkvmuxer::uint64, mkvmuxer::int64) override {}
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

  webm::Status OnInfo(const webm::ElementMetadata&,
                      const webm::Info& info) override {
    ASSERT(info.timecode_scale.is_present());
    ASSERT(info.duration.is_present());
    metadata_.timecode_scale = info.timecode_scale.value();
    metadata_.duration = info.duration.value();
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
      return webm::Status(webm::Status::kOkPartial);
    }
    *action = webm::Action::kRead;
    return webm::Status(webm::Status::kOkCompleted);
  }
};

// collect frames
struct FrameParserCallback : webm::Callback {
  std::vector<SimpleFrame> frames_;
  // track current ancestor cluster/block of current frame
  std::optional<webm::Cluster> cluster_;
  std::optional<webm::Block> block_;

  webm::Status OnClusterBegin(const webm::ElementMetadata&,
                              const webm::Cluster& cluster,
                              webm::Action* action) override {
    ASSERT(!cluster_);
    cluster_ = cluster;
    *action = webm::Action::kRead;
    return webm::Status(webm::Status::kOkCompleted);
  }

  webm::Status OnClusterEnd(const webm::ElementMetadata&,
                            const webm::Cluster&) override {
    ASSERT(cluster_);
    cluster_ = std::nullopt;
    return webm::Status(webm::Status::kOkCompleted);
  }

  webm::Status OnSimpleBlockBegin(const webm::ElementMetadata&,
                                  const webm::SimpleBlock& simple_block,
                                  webm::Action* action) override {
    ASSERT(!block_);
    block_ = simple_block;
    *action = webm::Action::kRead;
    return webm::Status(webm::Status::kOkCompleted);
  }

  webm::Status OnSimpleBlockEnd(const webm::ElementMetadata&,
                                const webm::SimpleBlock&) override {
    ASSERT(block_);
    block_ = std::nullopt;
    return webm::Status(webm::Status::kOkCompleted);
  }

  // taking only SimpleBlock seems fine
  webm::Status OnBlockBegin(const webm::ElementMetadata&,
                            const webm::Block&,
                            webm::Action* action) override {
    *action = webm::Action::kSkip;
    return webm::Status(webm::Status::kOkCompleted);
  }

  webm::Status OnFrame(const webm::FrameMetadata& metadata,
                       webm::Reader* reader,
                       uint64_t* bytes_remaining) override {
    ASSERT(cluster_);
    ASSERT(block_);
    ASSERT(cluster_.value().timecode.is_present());
    ASSERT(block_.value().num_frames == 1);
    ASSERT(block_.value().timecode >= 0);
    auto timecode = cluster_.value().timecode.value() + block_.value().timecode;
    auto track_number = block_.value().track_number;

    std::vector<uint8_t> data;
    data.resize((size_t)metadata.size);

    // assume single Read suffices (which should be the case for
    // BufferReader)
    uint64_t num_actually_read = 0;
    auto status =
        reader->Read((size_t)metadata.size, data.data(), &num_actually_read);

    // abort if not success
    if (!status.completed_ok()) {
      return webm::Status(webm::Status::kEndOfFile);
    }

    ASSERT(num_actually_read == metadata.size);
    frames_.push_back(SimpleFrame{track_number, timecode, data});
    *bytes_remaining = 0;
    return webm::Status(webm::Status::kOkCompleted);
  }
};

//
// main API
//

std::pair<webm::Status, SimpleMetadata> parseMetadata(
    const std::vector<uint8_t>& buffer) {
  MetadataParserCallback callback;
  webm::WebmParser parser;
  webm::BufferReader reader(buffer);
  auto status = parser.Feed(&callback, &reader);
  return std::make_pair(status, callback.metadata_);
}

std::string parseMetadataWrapper(const std::vector<uint8_t>& buffer) {
  auto [status, metadata] = parseMetadata(buffer);
  ASSERT(status.ok());
  return nlohmann::json(metadata).dump(2);
}

std::pair<webm::Status, std::vector<SimpleFrame>> parseFrames(
    const std::vector<uint8_t>& buffer) {
  FrameParserCallback callback;
  webm::WebmParser parser;
  webm::BufferReader reader(buffer);
  parser.DidSeek();
  auto status = parser.Feed(&callback, &reader);
  return std::make_pair(status, callback.frames_);  // TODO: avoid copy
}

std::vector<uint8_t> remux(const SimpleMetadata& metadata,
                           const std::vector<SimpleFrame>& frames,
                           bool fix_timestamp) {
  MkvBufferWriter writer;

  mkvmuxer::Segment muxer_segment;
  ASSERT(muxer_segment.Init(&writer));

  // add tracks
  for (auto& track_entry : metadata.track_entries) {
    ASSERT(track_entry.track_number);
    // TODO: parse sampleRate/channels
    ASSERT(muxer_segment.AddAudioTrack(
        48000, 2, (int32_t)track_entry.track_number.value()));
    auto track = reinterpret_cast<mkvmuxer::AudioTrack*>(
        muxer_segment.GetTrackByNumber(track_entry.track_number.value()));
    ASSERT(track);
    track->set_codec_id(mkvmuxer::Tracks::kOpusCodecId);
  }

  // add frames
  for (auto& frame : frames) {
    auto timecode = frame.timecode;
    if (fix_timestamp) {
      timecode -= frames[0].timecode;
    }
    auto timecode_ns = timecode * metadata.timecode_scale;
    // TODO: does "key frame" matter?
    ASSERT(muxer_segment.AddFrame(frame.data.data(), frame.data.size(),
                                  frame.track_number, timecode_ns, true));
  }

  if (!fix_timestamp) {
    muxer_segment.set_duration(metadata.duration);
  }
  ASSERT(muxer_segment.Finalize());
  return writer.data_;
}

std::vector<uint8_t> remuxWrapper(const std::vector<uint8_t>& metadata_buffer,
                                  const std::vector<uint8_t>& frame_buffer,
                                  bool fix_timestamp) {
  auto [metadata_status, metadata] = parseMetadata(metadata_buffer);
  auto [frame_status, frames] = parseFrames(frame_buffer);
  ASSERT(metadata_status.ok());
  ASSERT(frame_status.ok());
  return remux(metadata, frames, fix_timestamp);
}

}  // namespace utils_webm
