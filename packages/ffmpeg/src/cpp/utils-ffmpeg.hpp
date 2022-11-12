#pragma once

#include <map>
#include "utils.hpp"

extern "C" {
#include <libavformat/avio.h>
#include <libavutil/avutil.h>
#include <libavutil/dict.h>
}

namespace utils_ffmpeg {

#define ASSERT_AV(EXPR)                                                       \
  do {                                                                        \
    int code = EXPR;                                                          \
    if (code < 0) {                                                           \
      std::vector<char> message;                                              \
      message.resize(100);                                                    \
      av_strerror(code, message.data(), message.size());                      \
      std::ostringstream ostr;                                                \
      ostr << "[" << __FILE__ << ":" << __LINE__ << "] (AV-" << -code << ": " \
           << message.data() << ") " << #EXPR;                                \
      throw std::runtime_error{ostr.str()};                                   \
    }                                                                         \
  } while (0)

//
// AVDictionary to std::map
//

std::map<std::string, std::string> mapFromAVDictionary(
    const AVDictionary* dict) {
  std::map<std::string, std::string> result;
  AVDictionaryEntry* entry = nullptr;
  while ((entry = av_dict_get(dict, "", entry, AV_DICT_IGNORE_SUFFIX))) {
    result.insert({entry->key, entry->value});
  }
  return result;
}

//
// AVIOContext wrapper for in-memory data
//

struct BufferInput {
  AVIOContext* avio_ctx_;
  std::vector<uint8_t> input_;
  size_t input_pos_ = 0;

  BufferInput(const std::vector<uint8_t>& input) : input_{input} {
    // ffmpeg internal buffer (needs to be allocated on our own initially)
    constexpr size_t AVIO_BUFFER_SIZE = 1 << 12;  // 4K
    auto avio_buffer = reinterpret_cast<uint8_t*>(av_malloc(AVIO_BUFFER_SIZE));
    ASSERT(avio_buffer);

    // instantiate AVIOContext (`seek` doesn't seem necessary but why not)
    avio_ctx_ =
        avio_alloc_context(avio_buffer, AVIO_BUFFER_SIZE, 0, this,
                           BufferInput::readPacket, NULL, BufferInput::seek);
    ASSERT(avio_ctx_);
  }

  ~BufferInput() {
    av_freep(&avio_ctx_->buffer);
    avio_context_free(&avio_ctx_);
  }

  static int readPacket(void* opaque, uint8_t* buf, int buf_size) {
    return reinterpret_cast<BufferInput*>(opaque)->readPacketImpl(buf,
                                                                  buf_size);
  }

  int readPacketImpl(uint8_t* buf, int buf_size) {
    int read_size = std::min<int>(buf_size, input_.size() - input_pos_);
    if (read_size == 0) {
      return AVERROR_EOF;
    }
    std::memcpy(buf, &input_[input_pos_], read_size);
    input_pos_ += read_size;
    return read_size;
  }

  static int64_t seek(void* opaque, int64_t offset, int whence) {
    return reinterpret_cast<BufferInput*>(opaque)->seekImpl(offset, whence);
  }

  int64_t seekImpl(int64_t offset, int whence) {
    // cf. io_seek in third_party/FFmpeg/tools/target_dem_fuzzer.c

    if (whence == AVSEEK_SIZE) {
      return input_.size();
    }

    if (whence == SEEK_CUR) {
      offset += input_pos_;
    } else if (whence == SEEK_END) {
      offset = input_.size() - offset;
    }

    if (offset < 0 || input_.size() < (size_t)offset) {
      return -1;
    }
    input_pos_ = (size_t)offset;
    return 0;
  }
};

struct BufferOutput {
  AVIOContext* avio_ctx_;
  std::vector<uint8_t> output_;

  BufferOutput() {
    // ffmpeg internal buffer (needs to be allocated on our own initially)
    constexpr size_t AVIO_BUFFER_SIZE = 1 << 12;  // 4K
    auto avio_buffer = reinterpret_cast<uint8_t*>(av_malloc(AVIO_BUFFER_SIZE));
    ASSERT(avio_buffer);

    // instantiate AVIOContext
    avio_ctx_ = avio_alloc_context(avio_buffer, AVIO_BUFFER_SIZE, 1, this, NULL,
                                   BufferOutput::writePacket, NULL);
    ASSERT(avio_ctx_);
  }

  ~BufferOutput() {
    av_freep(&avio_ctx_->buffer);
    avio_context_free(&avio_ctx_);
  }

  static int writePacket(void* opaque, uint8_t* buf, int buf_size) {
    return reinterpret_cast<BufferOutput*>(opaque)->writePacketImpl(buf,
                                                                    buf_size);
  }

  int writePacketImpl(uint8_t* buf, int buf_size) {
    output_.insert(output_.end(), buf, buf + buf_size);
    return buf_size;
  }
};

}  // namespace utils_ffmpeg
