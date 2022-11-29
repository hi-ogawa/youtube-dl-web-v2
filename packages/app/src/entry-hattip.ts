import { compose } from "@hattip/compose";
import { createRequestHandler } from "rakkasjs";
import { initializeOtel, traceRequestHanlder } from "./utils/otel-utils";

initializeOtel();

export default compose(traceRequestHanlder, createRequestHandler());
