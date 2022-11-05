import { tinyassert } from "./tinyassert";

export interface ImageInfo {
  mimeType: string;
  width: number;
  height: number;
  depth: number;
  colors: number;
}

export class BytesWriter {
  private offset: number = 0;

  constructor(public data: Uint8Array) {}

  write(newData: Uint8Array) {
    this.data.set(newData, this.offset);
    this.offset += newData.length;
  }
}

export class BytesReader {
  private offset: number = 0;

  constructor(public data: Uint8Array) {}

  read(size: number): Uint8Array {
    const nextOffset = this.offset + size;
    tinyassert(nextOffset <= this.data.length);
    const result = this.data.slice(this.offset, nextOffset);
    this.offset = nextOffset;
    return result;
  }
}

export function bytesFromString(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function bytesFromU32BE(value: number): Uint8Array {
  return new Uint8Array([value >> 24, value >> 16, value >> 8, value]);
}

export function bytesToU16BE(value: Uint8Array): number {
  tinyassert(value.length === 2);
  return (value[0]! << 8) | value[1]!;
}
