import { Buffer } from "node:buffer";
import process from "node:process";
import { encode } from ".";

async function main() {
  const data = await streamToBuffer(process.stdin);
  const encoded = encode(data);
  return process.stdout.write(encoded);
}

async function streamToBuffer(it: AsyncIterable<Buffer>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of it) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

main();
