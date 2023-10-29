import { tinyassert } from "@hiogawa/utils";
import { z } from "zod";

// FormData wrapper to simplify uploading binary data with metadata

const KEY = z.enum(["metadata", "files"]).enum;

export function createFormData({
  metadata,
  files,
}: {
  metadata: unknown;
  files: Blob[];
}): FormData {
  const formData = new FormData();
  formData.set(KEY.metadata, JSON.stringify(metadata));
  for (const file of files) {
    formData.append(KEY.files, file);
  }
  return formData;
}

export function parseFormData(formData: FormData) {
  const metadataRaw = formData.get(KEY.metadata);
  tinyassert(typeof metadataRaw === "string");
  const metadata: unknown = JSON.parse(metadataRaw);

  const filesRaw = formData.getAll(KEY.files);
  const files: Blob[] = [];
  for (const file of filesRaw) {
    tinyassert(file instanceof Blob);
    files.push(file);
  }

  return {
    metadata,
    files,
  };
}
