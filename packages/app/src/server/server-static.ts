import fs from "node:fs";
import { Readable } from "node:stream";
import { RequestHandler } from "@hattip/compose";

// cf.
// https://github.com/honojs/node-server/blob/0a505a17112716987bc57b4be8df73df7dc6783a/src/serve-static.ts
// https://github.com/lukeed/sirv/blob/19c6895483cc71e9ef367f8a6a863af1e558ecb0/packages/sirv/index.js

export function serveStaticHandler(options?: {
  root?: string;
  contentTypes: Record<string, string>;
}): RequestHandler {
  const root = options?.root ?? "public";

  const contentTypes: Record<string, string> = {
    js: "application/javascript",
    json: "application/json",
    ...options?.contentTypes,
  };

  return async ({ request }) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return;
    }
    const url = new URL(request.url);
    const filePath = root + url.pathname;
    const stream = await readFileStream(filePath);
    if (stream) {
      const res = new Response(stream);
      const ext = filePath.split(".").at(-1);
      if (ext) {
        const contentType = contentTypes[ext];
        if (contentType) {
          res.headers.set("content-type", contentType);
        }
      }
    }
    return;
  };
}

async function readFileStream(
  filePath: string
): Promise<ReadableStream | undefined> {
  let dispose: (() => Promise<void>) | undefined;
  try {
    // open and set dispose callback
    const handle = await fs.promises.open(filePath, "r");
    dispose = () => handle.close();

    // skip directory
    const stat = await handle.stat();
    if (stat.isDirectory()) {
      return;
    }

    // convert to ReadableStream
    const nodeReadStream = handle.createReadStream({
      autoClose: true,
    });
    const webReadableStream = Readable.toWeb(nodeReadStream);
    dispose = undefined; // autoClose
    return webReadableStream as ReadableStream; // workaround confused ambient typing
  } catch (e) {
    if (!(e instanceof Error && "code" in e && e.code === "ENOENT")) {
      throw e;
    }
  } finally {
    await dispose?.();
  }
  return;
}
