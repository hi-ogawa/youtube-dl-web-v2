//
// jpeg metadata parser
// - https://github.com/nothings/stb/blob/8b5f1f37b5b75829fc72d38e7b5d4bcbf8a26d55/stb_image.h#L3330
// - https://gitlab.xiph.org/xiph/libopusenc/-/blob/f51c3aa431c2f0f8fccd8926628b5f330292489f/src/picture.c#L189

import { tinyassert } from "./tinyassert";
import { BytesReader, ImageInfo, bytesToU16BE } from "./utils";

export function parseJpeg(data: Uint8Array): ImageInfo {
  const reader = new BytesReader(data);

  //
  // cf. stbi__get_marker
  //
  const NONE = 0xff;

  function next(): number {
    let m = reader.read(1)[0]!;
    if (m !== NONE) {
      return NONE;
    }
    while (m === NONE) {
      m = reader.read(1)[0]!;
    }
    return m;
  }

  //
  // cf. stbi__decode_jpeg_header
  //
  let m = next();

  // SOI
  tinyassert(m === 0xd8);

  while (true) {
    m = next();
    // SOF
    if (0xc0 <= m && m <= 0xc2) {
      break;
    }
    // restart marker
    if (0xd0 <= m && m <= 0xd7) {
      continue;
    }
    // check valid marker and skip payload
    tinyassert(
      (0xe0 <= m && m <= 0xef) || m === 0xfe || [0xc4, 0xdb, 0xdd].includes(m)
    );
    const L = bytesToU16BE(reader.read(2));
    tinyassert(L >= 2);
    reader.read(L - 2);
  }

  //
  // cf. stbi__process_frame_header
  //
  const Lf = bytesToU16BE(reader.read(2));
  tinyassert(Lf >= 11);
  const p = reader.read(1)[0]!;
  tinyassert(p === 8);
  const img_y = bytesToU16BE(reader.read(2));
  const img_x = bytesToU16BE(reader.read(2));
  const c = reader.read(1)[0]!;

  return {
    mimeType: "image/jpeg",
    width: img_x,
    height: img_y,
    depth: c * p,
    colors: 0,
  };
}
