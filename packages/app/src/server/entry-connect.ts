import { createMiddleware } from "@hattip/adapter-node";
import { createHattipEntry } from "./entry-hattip";

export default createMiddleware(createHattipEntry());
