import { exec } from "node:child_process";
import { promisify } from "node:util";

const execPromsie = promisify(exec);

export default async () => {
  await execPromsie("make localstack/reset/test");
};
