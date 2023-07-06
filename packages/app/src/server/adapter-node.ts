import { createMiddleware } from "@hattip/adapter-node";
import { createHattipEntry } from ".";

export default createMiddleware(createHattipEntry(), { trustProxy: true });
