import { expect, test } from "@playwright/test";

test("title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Youtube DL Web");
});

test("basic", async ({ page }) => {
  await page.goto("/");
  // wait until hydrated (otherwise event handlers are not ready e.g. form onSubmit)
  await page.waitForSelector("main[data-hydrated=true]");

  // search video
  await page
    .getByPlaceholder("ID or URL")
    .fill("https://www.youtube.com/watch?v=rv4wf7bzfFE");
  await page.getByRole("button", { name: "Search" }).click();

  // pre-filled based on channel name and video title
  await expect(page.locator('input[name="artist"]')).toHaveValue("Vulf");
  await expect(page.locator('input[name="title"]')).toHaveValue(
    "VULFPECK /// Live at Madison Square Garden"
  );

  // update form
  await page.locator('input[name="artist"]').fill("VULFPECK");
  await page
    .locator('input[name="title"]')
    .fill("Animal Spirits /// Live at Madison Square Garden");
  await page.locator('input[name="startTime"]').fill("4:19");
  await page.locator('input[name="endTime"]').fill("7:55");

  // start download (i.e. fetching + processing)
  await page.getByRole("button", { name: "Download" }).click();

  // success message
  await page.waitForSelector("'successfully downloaded'");

  // trigger file dialog
  const downloadPromise = page.waitForEvent("download");
  await page.locator("a >> 'Finished!'").click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).toBeDefined();
});
