import { beforeAll } from "vitest";
import { initializeServer } from "../../utils/server-utils";

beforeAll(async () => {
  await initializeServer();
});
