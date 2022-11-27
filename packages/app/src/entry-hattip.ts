import { createRequestHandler } from "rakkasjs";
import { initializeOtel } from "./utils/otel-utils";

initializeOtel();

export default createRequestHandler({
  middleware: {
    beforePages: (ctx) => {
      ctx;
    },
    beforeApiRoutes: (ctx) => {
      ctx;
    },
  },
});
