import { compose } from "@hattip/compose";
import { createRequestHandler } from "rakkasjs";
import { traceRequestHanlder } from "./utils/otel-utils";

export default compose(traceRequestHanlder, createRequestHandler());
