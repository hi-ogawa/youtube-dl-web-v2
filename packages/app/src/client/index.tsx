import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import { globPageRoutes } from "@hiogawa/vite-glob-routes/dist/react-router";
import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { registerServiceWorker } from "../utils/register-service-worker";

function main() {
  registerServiceWorker();
  const el = document.getElementById("root");
  tinyassert(el);

  const { routes } = globPageRoutes();
  const router = createBrowserRouter(routes);
  const reactEl = (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );

  const reactRoot = createRoot(el);
  reactRoot.render(reactEl);
}

main();
