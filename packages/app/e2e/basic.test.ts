import { expect, test } from "@playwright/test";

test("title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Youtube DL Web");
});

test("basic", async ({ page }) => {
  await page.goto("/");

  // search video
  await page
    .getByPlaceholder("ID or URL")
    .fill("https://www.youtube.com/watch?v=rv4wf7bzfFE");
  await page.getByRole("button", { name: "Search" }).click();

  // pre-filled based on channel name and video title
  await expect(page.locator('input[name="artist"]')).toHaveValue("Vulf");
  await expect(page.locator('input[name="title"]')).toHaveValue(
    "Vulfpeck Live at Madison Square Garden"
  );

  // update form
  await page.locator('input[name="artist"]').fill("VULFPECK");
  await page
    .locator('input[name="title"]')
    .fill("Animal Spirits /// Live at Madison Square Garden");
  await page.locator('input[name="startTime"]').fill("4:19");
  await page.locator('input[name="endTime"]').fill("7:55");

  // start download (i.e. fetching + processing)
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();

  // success message
  await page.waitForSelector("'successfully downloaded'");
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "VULFPECK - Animal Spirits ___ Live at Madison Square Garden.opus"
  );

  // upload to share
  await page.getByRole("button", { name: "Upload to share" }).click();
  await page.getByText("successfuly uploaded").click();

  // check uploaded file
  await page.getByRole("banner").getByRole("button").first().click();
  await page.getByRole("link", { name: "Uploaded" }).click();
  await page.waitForURL("/share");
  await page
    .getByText("Animal Spirits /// Live at Madison Square Garden")
    .click();

  const downloadPromise2 = page.waitForEvent("download");
  await page.locator(".i-ri-download-line").click();
  const download2 = await downloadPromise2;
  expect(download2.suggestedFilename()).toBe(
    "VULFPECK - Animal Spirits ___ Live at Madison Square Garden.opus"
  );
});
