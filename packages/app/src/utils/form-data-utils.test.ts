import { expect, it } from "vitest";
import { createFormData, parseFormData } from "./form-data-utils";

it("basic", () => {
  const formData = createFormData({
    metadata: { key: "value" },
    files: [new Blob(["abc"]), new Blob(["defghi"])],
  });

  let entries: any[] = [];
  formData.forEach((v, k) => entries.push([k, v]));
  expect(entries).toMatchInlineSnapshot(`
    [
      [
        "metadata",
        "{\\"key\\":\\"value\\"}",
      ],
      [
        "files",
        File {
          Symbol(kHandle): Blob {},
          Symbol(kLength): 3,
          Symbol(kType): "",
        },
      ],
      [
        "files",
        File {
          Symbol(kHandle): Blob {},
          Symbol(kLength): 6,
          Symbol(kType): "",
        },
      ],
    ]
  `);

  const parsed = parseFormData(formData);
  expect(parsed).toMatchInlineSnapshot(`
    {
      "files": [
        File {
          Symbol(kHandle): Blob {},
          Symbol(kLength): 3,
          Symbol(kType): "",
        },
        File {
          Symbol(kHandle): Blob {},
          Symbol(kLength): 6,
          Symbol(kType): "",
        },
      ],
      "metadata": {
        "key": "value",
      },
    }
  `);
});
