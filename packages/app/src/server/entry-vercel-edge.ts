import adapterVercelEdge from "@hattip/adapter-vercel-edge";
import { createHattipEntry } from "./entry-hattip";

export default adapterVercelEdge(createHattipEntry());
