export function triggerDownloadClick({
  href,
  download,
}: {
  href: string;
  download?: string;
}) {
  // TODO: would it work when the tab is not focused?
  const a = document.createElement("a");
  a.setAttribute("href", href);
  if (download) {
    a.setAttribute("download", download);
  }
  a.click();
}
