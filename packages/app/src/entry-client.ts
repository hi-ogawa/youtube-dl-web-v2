import "virtual:uno.css";
import { startClient } from "rakkasjs";
import { registerServiceWorker } from "./utils/register-service-worker";

startClient({
  hooks: {
    beforeStart: () => {
      registerServiceWorker();
    },
  },
});
