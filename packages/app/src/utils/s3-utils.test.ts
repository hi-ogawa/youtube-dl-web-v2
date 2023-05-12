import { fetch } from "undici";
import { assert, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  s3GetDownloadUrl,
  s3GetUploadUrl,
  s3ListKeys,
  s3ResetBucket,
} from "./s3-utils";

describe("s3-utils", () => {
  beforeAll(async () => {
    await s3ResetBucket();
  });

  it("basic", async () => {
    {
      const res = await s3ListKeys();
      expect(res).toMatchInlineSnapshot("[]");
    }

    {
      const uploadUrl = await s3GetUploadUrl("hello.txt");
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: "hello world",
      });
      assert.ok(res.ok);
    }

    {
      let res = await s3ListKeys();
      res = z
        .object({
          ETag: z.any(),
          Key: z.any(),
          Size: z.any(),
        })
        .array()
        .parse(res);
      expect(res).toMatchInlineSnapshot(`
        [
          {
            "ETag": "\\"5eb63bbbe01eeed093cb22bb8f5acdc3\\"",
            "Key": "hello.txt",
            "Size": 11,
          },
        ]
      `);
    }

    {
      const downloadUrl = await s3GetDownloadUrl("hello.txt");
      const res = await fetch(downloadUrl);
      assert.ok(res.ok);
      expect(await res.text()).toMatchInlineSnapshot('"hello world"');
    }
  });
});
