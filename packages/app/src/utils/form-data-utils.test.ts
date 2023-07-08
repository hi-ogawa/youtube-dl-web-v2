import { expect, it } from "vitest";
import { createFormData, parseFormData } from "./form-data-utils";

it("basic", () => {
  const formData = createFormData({
    metadata: { key: "value" },
    files: [
      new File(["abc"], "test1.txt", { lastModified: 1 }),
      new File(["defghi"], "test2.txt", { lastModified: 2 }),
    ],
  });
  expect(formData).toMatchInlineSnapshot(`
    FormData {
      Symbol(state): [
        {
          "name": "metadata",
          "value": "{\\"key\\":\\"value\\"}",
        },
        {
          "name": "files",
          "value": File {
            "_lastModified": 1,
            "_name": "test1.txt",
            Symbol(kHandle): Blob {},
            Symbol(kLength): 3,
            Symbol(kType): "",
          },
        },
        {
          "name": "files",
          "value": File {
            "_lastModified": 2,
            "_name": "test2.txt",
            Symbol(kHandle): Blob {},
            Symbol(kLength): 6,
            Symbol(kType): "",
          },
        },
      ],
    }
  `);

  const parsed = parseFormData(formData);
  expect(parsed).toMatchInlineSnapshot(`
    {
      "files": [
        File {
          "_lastModified": 1,
          "_name": "test1.txt",
          Symbol(kHandle): Blob {},
          Symbol(kLength): 3,
          Symbol(kType): "",
        },
        File {
          "_lastModified": 2,
          "_name": "test2.txt",
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
