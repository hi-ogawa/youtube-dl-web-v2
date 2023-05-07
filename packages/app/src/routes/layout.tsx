import { usePrevious } from "@hiogawa/utils-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Head, LayoutProps, Link, useLocation } from "rakkasjs";
import React from "react";
import { Toaster } from "react-hot-toast";
import { Drawer } from "../components/drawer";
import { ThemeSelect } from "../components/theme-select";

export default function Layout(props: LayoutProps) {
  return (
    <>
      <Head
        title="Youtube DL Web"
        viewport="width=device-width, initial-scale=1.0"
      />
      <AppProvider>
        <PageHeader {...props} />
        {props.children}
      </AppProvider>
    </>
  );
}

function PageHeader(props: LayoutProps) {
  const title = (props.meta["title"] as string) || "Youtube DL Web";
  const [menuOpen, setMenuOpen] = React.useState(false);

  // auto close on nav change
  const location = useLocation();
  const prev = usePrevious(location.pending);
  React.useEffect(() => {
    if (!prev && location.pending) {
      setMenuOpen(false);
    }
  }, [location.pending]);

  // shadow color taken from https://ant.design/components/overview/
  return (
    <header className="flex items-center gap-3 px-6 py-2 shadow-[0_2px_8px_#f0f1f2] dark:shadow-[0_2px_8px_#000000a6]">
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
            <Link
              className="p-2 pl-7 flex items-center gap-3 antd-menu-item"
              href="/"
            >
              <span className="i-ri-home-4-line w-5 h-5"></span>
              Home
            </Link>
            <Link
              className="p-2 pl-7 flex items-center gap-3 antd-menu-item"
              href="/edit"
            >
              <span className="i-ri-edit-2-line w-5 h-5"></span>
              Edit
            </Link>
          </div>
        </div>
      </Drawer>
    </header>
  );
}

//
// providers
//

function AppProvider(props: React.PropsWithChildren) {
  let node = props.children;
  for (const Provider of [ToastProvider, CustomQueryClientProvider]) {
    node = <Provider>{node}</Provider>;
  }
  return <>{node}</>;
}

function CustomQueryClientProvider(props: React.PropsWithChildren) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 0,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

function ToastProvider(props: React.PropsWithChildren) {
  return (
    <>
      <Toaster />
      {props.children}
    </>
  );
}
