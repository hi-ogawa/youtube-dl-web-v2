import { tinyassert } from "@hiogawa/utils";
import { Blob, FormData, fetch } from "@remix-run/web-fetch";
import { assert, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  getAssetDownloadUrl,
  getAssetUploadPost,
  listAssets,
  s3GetDownloadUrl,
  s3GetUploadPost,
  s3ListObjects,
  s3ResetBucket,
} from "./s3-utils";

describe("s3-utils", () => {
  beforeAll(async () => {
    await s3ResetBucket();
  });

  it("basic", async () => {
    {
      const res = await s3ListObjects({});
      expect(res).toMatchInlineSnapshot("[]");
    }

    {
      const { url, fields } = await s3GetUploadPost({ Key: "hello.txt" });
      const formData = new FormData();
      for (const [k, v] of Object.entries(fields)) {
        formData.append(k, v);
      }
      formData.append("file", new Blob(["hello world"]));
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });
      assert.ok(res.ok);
    }

    {
      let res = await s3ListObjects({});
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
      const downloadUrl = await s3GetDownloadUrl({
        Key: "hello.txt",
        ResponseContentType: "plain/text",
        ResponseContentDisposition: `attachment; filename="different.txt"`,
      });
      const res = await fetch(downloadUrl);
      assert.ok(res.ok);
      expect(await res.text()).toMatchInlineSnapshot('"hello world"');

      let headers = Object.fromEntries(res.headers.entries());
      headers = z
        .object({
          "content-length": z.string(),
          "content-disposition": z.string(),
          "content-type": z.string(),
        })
        .parse(headers);
      expect(headers).toMatchInlineSnapshot(`
        {
          "content-disposition": "attachment; filename=\\"different.txt\\"",
          "content-length": "11",
          "content-type": "plain/text",
        }
      `);
    }
  });
});

describe("asset-utils", () => {
  beforeAll(async () => {
    await s3ResetBucket();
  });

  it("basic", async () => {
    {
      const assets = await listAssets();
      expect(assets).toMatchInlineSnapshot(`
        {
          "assets": [],
          "nextCursor": undefined,
        }
      `);
    }

    {
      const { url, fields } = await getAssetUploadPost({
        sortKey: "abc",
        filename: "hello.txt",
        contentType: "plain/txt",
        extra: { videoId: "D-X0jqkguhs" },
      });
      const formData = new FormData();
      for (const [k, v] of Object.entries(fields)) {
        formData.append(k, v);
      }
      formData.append("file", new Blob(["hello world"]));
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });
      assert.ok(res.ok);
    }

    {
      const res = await listAssets();
      expect(res).toMatchInlineSnapshot(`
        {
          "assets": [
            {
              "contentType": "plain/txt",
              "extra": {
                "videoId": "D-X0jqkguhs",
              },
              "filename": "hello.txt",
              "key": "abc-eyJmaWxlbmFtZSI6ImhlbGxvLnR4dCIsImNvbnRlbnRUeXBlIjoicGxhaW4vdHh0IiwiZXh0cmEiOnsidmlkZW9JZCI6IkQtWDBqcWtndWhzIn19",
              "sortKey": "abc",
            },
          ],
          "nextCursor": "abc-eyJmaWxlbmFtZSI6ImhlbGxvLnR4dCIsImNvbnRlbnRUeXBlIjoicGxhaW4vdHh0IiwiZXh0cmEiOnsidmlkZW9JZCI6IkQtWDBqcWtndWhzIn19",
        }
      `);

      const url = await getAssetDownloadUrl({ key: res.assets[0].key });
      const download = await fetch(url);
      tinyassert(download.ok);
      expect(await download.text()).toMatchInlineSnapshot('"hello world"');
    }
  });
});