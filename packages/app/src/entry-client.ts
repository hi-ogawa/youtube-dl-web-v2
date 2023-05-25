import "virtual:uno.css";
import { startClient } from "rakkasjs";
import { initializePublicConfigClient } from "./utils/config-public";
import { registerServiceWorker } from "./utils/register-service-worker";

startClient({
  hooks: {
    beforeStart: () => {
      registerServiceWorker();
      initializePublicConfigClient();
    },
  },
});
