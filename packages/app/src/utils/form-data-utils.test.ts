import { expect, it } from "vitest";
import { createFormData, parseFormData } from "./form-data-utils";

it("basic", () => {
  const formData = createFormData({
    metadata: { key: "value" },
    files: [new Blob(["abc"]), new Blob(["defghi"])],
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
            Symbol(kHandle): Blob {},
            Symbol(kLength): 3,
            Symbol(kType): "",
          },
        },
        {
          "name": "files",
          "value": File {
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
