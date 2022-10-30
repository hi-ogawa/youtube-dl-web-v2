import process from "process";
import undici from "undici";
import { tinyassert } from "../utils/tinyassert";

const BASE_URL = "https://www.youtube.com/results";
const INITIAL_DATA_RE = /var ytInitialData = ({.*?});<\/script>/;

async function main() {
  const [q] = process.argv.slice(2);
  tinyassert(q);

  const url =
    BASE_URL + "?" + new URLSearchParams({ hl: "en", search_query: q });

  console.error(`:: fetching "${url}"`);
  const res = await undici.fetch(url);
  tinyassert(res.ok);

  const resText = await res.text();
  const match = resText.match(INITIAL_DATA_RE);
  tinyassert(match);
  process.stdout.write(match[1]);
}

main();
