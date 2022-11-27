import { createRequestHandler } from "rakkasjs";
import { initializeOtel } from "./utils/otel-utils";

initializeOtel();

export default createRequestHandler({});
