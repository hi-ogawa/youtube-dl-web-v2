import { Compose } from "@hiogawa/utils-react";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import { Toaster, toast } from "react-hot-toast";
import { NavLink, Outlet, useLocation, useRouteError } from "react-router-dom";
import { Drawer } from "../components/drawer";
import { ThemeSelect } from "../components/theme-select";

export function Component() {
  return (
    <Compose
      elements={[<QueryClientWrapper />, <ToastWrapper />, <PageInner />]}
    />
  );
}

function PageInner() {
  return (
    <div className="flex flex-col relative">
      <div className="top-0 sticky antd-body">
        <PageHeader />
      </div>
      <div className="flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}

function PageHeader() {
  const title = "Youtube DL Web";
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="flex-none flex items-center gap-3 px-6 py-2 shadow-[0_2px_8px_#f0f1f2] dark:shadow-[0_2px_8px_#000000a6]">
      <button
        className="pl-1 py-1 antd-btn antd-btn-ghost flex items-center"
        onClick={() => setMenuOpen(true)}
      >
        <span className="i-ri-menu-line w-5 h-5"></span>
      </button>
      <div className="text-lg">{title}</div>
      <span className="flex-1"></span>
      <ThemeSelect />
      <a
        className="flex items-center antd-btn antd-btn-ghost pl-1"
        href="https://github.com/hi-ogawa/youtube-dl-web-v2"
        target="_blank"
      >
        <span className="i-ri-github-line w-5 h-5"></span>
      </a>
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="flex flex-col py-2 gap-2">
          <div className="pl-7 py-1">
            <button
              className="antd-btn antd-btn-ghost flex items-center"
              onClick={() => setMenuOpen(false)}
            >
              <span className="i-ri-menu-line w-5 h-5"></span>
            </button>
          </div>
          <div className="flex flex-col gap-4 p-1">
            <NavLink
              className="p-2 pl-7 flex items-center gap-3 antd-menu-item aria-[current=page]:antd-menu-item-active"
              to="/"
              onClick={() => setMenuOpen(false)}
            >
              <span className="i-ri-home-4-line w-5 h-5"></span>
              Home
            </NavLink>
            <NavLink
              className="p-2 pl-7 flex items-center gap-3 antd-menu-item aria-[current=page]:antd-menu-item-active"
              to="/edit"
              onClick={() => setMenuOpen(false)}
            >
              <span className="i-ri-edit-2-line w-5 h-5"></span>
              Edit
            </NavLink>
            <NavLink
              className="p-2 pl-7 flex items-center gap-3 antd-menu-item aria-[current=page]:antd-menu-item-active"
              to="/share"
              onClick={() => setMenuOpen(false)}
            >
              <span className="i-ri-share-line w-5 h-5"></span>
              Uploaded
            </NavLink>
          </div>
        </div>
      </Drawer>
    </header>
  );
}

function QueryClientWrapper(props: React.PropsWithChildren) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 0,
          },
          mutations: {
            onError: (error) => {
              console.error("mutation error", error);
              toast.error("something went wrong...");
            },
          },
        },
        queryCache: new QueryCache({
          onError(error, _query) {
            console.error("query error", error);
            toast.error("something went wrong...");
          },
        }),
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

function ToastWrapper(props: React.PropsWithChildren) {
  return (
    <>
      <Toaster />
      {props.children}
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const location = useLocation();

  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex flex-col gap-3 w-full max-w-2xl">
        {location.pathname !== "/" && (
          <div>
            <a href="/" className="antd-btn antd-btn-default px-2 py-1">
              Back to Home
            </a>
          </div>
        )}
        <pre
          className="text-sm overflow-auto border p-2 text-colorErrorText bg-colorErrorBg border-colorErrorBorder"
          suppressHydrationWarning
        >
          {error instanceof Error
            ? error.stack ?? error.message
            : JSON.stringify(error, null, 2)}
        </pre>
      </div>
    </div>
  );
}
