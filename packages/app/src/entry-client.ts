import { startClient } from "rakkasjs";
import { registerServiceWorker } from "./utils/register-service-worker";
import "./styles";

startClient({
  hooks: {
    beforeStart: () => {
      registerServiceWorker();
    },
  },
});
