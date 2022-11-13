import process from "node:process";
import Undici from "undici";
import { tinyassert } from "../utils/tinyassert";
import { fetchVideoInfoRaw, parseVideoId } from "../utils/youtube-utils";

// usage:
//   pnpm -s ts ./src/misc/fetch-info.ts --id https://www.youtube.com/watch?v=9wxuKgfkQXs > test.json

// patch global
(globalThis as any).fetch ??= Undici.fetch;

async function main() {
  const cli = new Cli(process.argv.slice(2));
  let id = cli.arg("--id");
  tinyassert(id);
  id = parseVideoId(id);
  tinyassert(id);

  const info = await fetchVideoInfoRaw(id);
  console.log(JSON.stringify(info, null, 2));
}

class Cli {
  constructor(private argv: string[]) {}

  arg(flag: string): string | undefined {
    const index = this.argv.indexOf(flag);
    return index !== -1 ? this.argv[index + 1] : undefined;
  }
}

main();
