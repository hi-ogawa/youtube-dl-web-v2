import { beforeAll } from "vitest";
import { initializeServer } from "../../utils/server-utils";

// @ts-expect-error prettier-ignore
import { File, Blob } from "@remix-run/web-file";

beforeAll(async () => {
  Object.assign(globalThis, { File, Blob });
  await initializeServer();
});
