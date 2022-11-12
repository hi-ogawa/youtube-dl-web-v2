export interface EmbindVector {
  resize: (length: number, defaultValue: number) => void;
  view(): Uint8Array;
}

export interface EmbindStringMap {
  set(k: string, v: string): void;
}

export interface Metadata {
  bit_rate: number;
  duration: number;
  format_name: string; // e.g. ogg
  metadata: Record<string, string>;
  streams: {
    type: string; // e.g. audio, video
    codec: string; // e.g. opus
    metadata: Record<string, string>;
  }[];
}

export interface EmscriptenModule {
  embind_Vector: new () => EmbindVector;
  embind_StringMap: new () => EmbindStringMap;
  embind_convert: (
    in_data: EmbindVector,
    out_format: string,
    metadata: EmbindStringMap,
    start_time: number,
    end_time: number
  ) => EmbindVector;
  embind_extractMetadata: (in_data: EmbindVector) => string; // stringified Metadata
}

export type EmscriptenInit = (options?: {
  locateFile: (filename: string) => string;
}) => Promise<EmscriptenModule>;
