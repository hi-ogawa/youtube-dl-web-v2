export interface EmbindVector {
  resize: (length: number, defaultValue: number) => void;
  view(): Uint8Array;
}

export interface SimpleTrackEntry {
  track_number?: number;
  track_type?: number;
  codec_id?: number;
}

export interface SimpleCuePoint {
  time?: number;
  track?: number;
  duration?: number;
  cluster_position?: number;
}

export interface SimpleMetadata {
  segment_body_start?: number;
  track_entries: SimpleTrackEntry[];
  cue_points: SimpleCuePoint[];
}

export interface EmscriptenModule {
  embind_Vector: new () => EmbindVector;

  embind_parseMetadataWrapper: (metadata_buffer: EmbindVector) => string; // stringified SimpleMetadata

  embind_remuxWrapper: (
    metadata_buffer: EmbindVector,
    frame_buffer: EmbindVector
  ) => EmbindVector;
}

export type EmscriptenInit = (options?: {
  locateFile: (filename: string) => string;
}) => Promise<EmscriptenModule>;
