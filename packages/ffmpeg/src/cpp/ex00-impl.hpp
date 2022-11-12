// - [x] remux (e.g. webm to opus)
// - [x] filter by selected timestamp range
// - [x] embed metadata
// - [x] embed thumbnail
// - [x] extract metadata
// - [x] extract thumbnail

#include <cstring>
#include <nlohmann/json.hpp>
#include <optional>
#include "utils-ffmpeg.hpp"
#include "utils.hpp"

extern "C" {
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libavformat/avio.h>
#include <libavutil/avutil.h>
}

namespace ex00_impl {

using utils_ffmpeg::BufferInput;
using utils_ffmpeg::BufferOutput;

// demux to single stream
std::vector<uint8_t> convert(const std::vector<uint8_t>& in_data,
                             const std::string& out_format,
                             const std::map<std::string, std::string>& metadata,
                             double start_time,  // -1 to indicate no value
                             double end_time) {
  // validate timestamp
  if (start_time >= 0 && end_time >= 0) {
    ASSERT(start_time <= end_time);
  }

  // input context
  BufferInput input_{in_data};
  AVFormatContext* ifmt_ctx_ = avformat_alloc_context();
  ASSERT(ifmt_ctx_);
  DEFER {
    avformat_close_input(&ifmt_ctx_);
  };
  ifmt_ctx_->pb = input_.avio_ctx_;
  ifmt_ctx_->flags |= AVFMT_FLAG_CUSTOM_IO;

  ASSERT(avformat_open_input(&ifmt_ctx_, NULL, NULL, NULL) == 0);
  ASSERT(avformat_find_stream_info(ifmt_ctx_, NULL) == 0);

  // output context
  BufferOutput output_;
  AVFormatContext* ofmt_ctx_;
  avformat_alloc_output_context2(&ofmt_ctx_, NULL, out_format.c_str(), NULL);
  ASSERT(ofmt_ctx_);
  DEFER {
    avformat_free_context(ofmt_ctx_);
  };
  ofmt_ctx_->pb = output_.avio_ctx_;

  // for now only allow single media type container (e.g. opus, mjpeg)
  ASSERT(ofmt_ctx_->oformat->audio_codec == AV_CODEC_ID_NONE ||
         ofmt_ctx_->oformat->video_codec == AV_CODEC_ID_NONE);
  AVMediaType out_media_type =
      ofmt_ctx_->oformat->video_codec == AV_CODEC_ID_NONE ? AVMEDIA_TYPE_AUDIO
                                                          : AVMEDIA_TYPE_VIDEO;

  // write metadata
  for (auto [k, v] : metadata) {
    av_dict_set(&ofmt_ctx_->metadata, k.c_str(), v.c_str(), 0);
  }

  // input stream
  auto stream_index =
      av_find_best_stream(ifmt_ctx_, out_media_type, -1, -1, NULL, 0);
  ASSERT(stream_index >= 0);
  AVStream* in_stream = ifmt_ctx_->streams[stream_index];
  ASSERT(in_stream);

  // output stream
  AVStream* out_stream = avformat_new_stream(ofmt_ctx_, nullptr);
  ASSERT(out_stream);
  ASSERT(avcodec_parameters_copy(out_stream->codecpar, in_stream->codecpar) >=
         0);
  out_stream->time_base = in_stream->time_base;

  // allocate AVPacket
  AVPacket* pkt = av_packet_alloc();
  ASSERT(pkt);
  DEFER {
    av_packet_free(&pkt);
  };

  // write header
  ASSERT(avformat_write_header(ofmt_ctx_, nullptr) >= 0);

  // convert to "time base" unit
  int64_t start_time_tb =
      start_time >= 0
          ? av_rescale_q(static_cast<int64_t>(start_time * AV_TIME_BASE),
                         AV_TIME_BASE_Q, in_stream->time_base)
          : -1;
  int64_t end_time_tb =
      end_time >= 0
          ? av_rescale_q(static_cast<int64_t>(end_time * AV_TIME_BASE),
                         AV_TIME_BASE_Q, in_stream->time_base)
          : -1;

  // copy packets with timestamp filtering
  std::vector<uint8_t> result;
  while (av_read_frame(ifmt_ctx_, pkt) >= 0) {
    if (pkt->stream_index != stream_index) {
      av_packet_unref(pkt);
      continue;
    }
    if (end_time >= 0) {
      if (pkt->pts >= end_time_tb) {
        av_packet_unref(pkt);
        break;
      }
    }
    if (start_time >= 0) {
      if (pkt->pts < start_time_tb) {
        av_packet_unref(pkt);
        continue;
      }
      pkt->pts -= start_time_tb;
      pkt->dts -= start_time_tb;
    }
    pkt->stream_index = out_stream->index;
    av_packet_rescale_ts(pkt, in_stream->time_base, out_stream->time_base);
    ASSERT(av_interleaved_write_frame(ofmt_ctx_, pkt) == 0);
    av_packet_unref(pkt);
  }
  ASSERT(av_interleaved_write_frame(ofmt_ctx_, nullptr) == 0);

  // write trailer
  av_write_trailer(ofmt_ctx_);

  // return vector
  return output_.output_;
}

std::string extractMetadata(const std::vector<uint8_t>& in_data) {
  // input context
  BufferInput input_{in_data};
  AVFormatContext* ifmt_ctx_ = avformat_alloc_context();
  ASSERT(ifmt_ctx_);
  DEFER {
    avformat_close_input(&ifmt_ctx_);
  };
  ifmt_ctx_->pb = input_.avio_ctx_;
  ifmt_ctx_->flags |= AVFMT_FLAG_CUSTOM_IO;

  ASSERT(avformat_open_input(&ifmt_ctx_, NULL, NULL, NULL) == 0);
  ASSERT(avformat_find_stream_info(ifmt_ctx_, NULL) == 0);

  auto result = nlohmann::json::object(
      {{"format_name", ifmt_ctx_->iformat->name},
       {"duration", ifmt_ctx_->duration},
       {"bit_rate", ifmt_ctx_->bit_rate},
       {"metadata", utils_ffmpeg::mapFromAVDictionary(ifmt_ctx_->metadata)},
       {"streams", nlohmann::json::array()}});

  for (unsigned int i = 0; i < ifmt_ctx_->nb_streams; i++) {
    auto stream = ifmt_ctx_->streams[i];
    auto streamInfo = nlohmann::json::object(
        {{"type", nullptr},
         {"codec", nullptr},
         {"metadata", utils_ffmpeg::mapFromAVDictionary(stream->metadata)}});

    const AVCodec* codec = avcodec_find_decoder(stream->codecpar->codec_id);
    if (codec) {
      streamInfo["codec"] = codec->name;
      auto type_string =
          codec ? av_get_media_type_string(codec->type) : nullptr;
      if (type_string) {
        streamInfo["type"] = type_string;
      }
    }
    result["streams"].push_back(streamInfo);
  }

  return result.dump(2);
}

}  // namespace ex00_impl
