import fs from "fs";
import { describe, expect, it } from "vitest";
import { encode } from "..";
import { parseJpeg } from "../jpeg";

describe("flac-picture", () => {
  describe("parseJpeg", () => {
    it("success", async () => {
      const data = await fs.promises.readFile("./misc/test.jpg");
      const info = parseJpeg(data);
      expect(info).toMatchInlineSnapshot(`
        {
          "colors": 0,
          "depth": 24,
          "height": 360,
          "mimeType": "image/jpeg",
          "width": 480,
        }
      `);
    });
  });

  describe("encode", () => {
    it("success", async () => {
      const data = await fs.promises.readFile("./misc/test.jpg");
      const encoded = encode(data);
      expect(encoded.slice(0, 100)).toMatchInlineSnapshot(
        '"AAAAAwAAAAppbWFnZS9qcGVnAAAAAAAAAeAAAAFoAAAAGAAAAAAAAD3s/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABALDA4MChAO"'
      );
    });
  });
});
