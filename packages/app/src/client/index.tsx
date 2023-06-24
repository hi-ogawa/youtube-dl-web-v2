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
  const root = createRoot(el);
  root.render(<Root />);
}

function Root() {
  const [router] = React.useState(() => createBrowserRouter(globPageRoutes()));
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

main();
