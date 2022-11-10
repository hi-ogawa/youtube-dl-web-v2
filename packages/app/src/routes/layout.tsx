import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  Head,
  HeadersFunction,
  LayoutProps,
  Link,
  useLocation,
} from "rakkasjs";
import React from "react";
import { Edit, GitHub, Home, Menu, Moon, Sun } from "react-feather";
import { Toaster } from "react-hot-toast";
import ICON_URL from "../assets/icon-32.png?url";
import { Drawer } from "../components/drawer";
import THEME_SCRIPT from "../utils/theme-script.js?raw";
import { usePrevious } from "../utils/use-previous";
import { useThemeState } from "../utils/use-theme-state";
import { WORKER_ASSET_URLS } from "../utils/worker-client";

export default function Layout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>Youtube DL Web</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href={ICON_URL} />
        <link rel="manifest" href="/manifest.json" />
        {/* it doesn't have to be so high priority, but don't want to spend time fetching them during instantiating emscripten module */}
        {WORKER_ASSET_URLS.map((href) => (
          <link key={href} rel="prefetch" href={href} />
        ))}
        <script>{THEME_SCRIPT}</script>
      </Head>
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
      <button className="p-1 btn btn-ghost" onClick={() => setMenuOpen(true)}>
        <Menu className="w-5 h-5" />
      </button>
      <div className="text-lg">{title}</div>
      <span className="flex-1"></span>
      <ThemeButton />
      <a
        className="flex items-center btn btn-ghost pl-1"
        href="https://github.com/hi-ogawa/youtube-dl-web-v2"
        target="_blank"
      >
        <GitHub className="w-5 h-5" />
      </a>
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="flex flex-col gap-2">
          <div className="pl-6 py-2">
            <button
              className="p-1 btn btn-ghost"
              onClick={() => setMenuOpen(false)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <Link
              className="pl-7 flex items-center gap-3 btn btn-ghost"
              href="/"
            >
              <Home className="w-5 h-5" />
              Home
            </Link>
            <Link
              className="pl-7 flex items-center gap-3 btn btn-ghost"
              href="/edit"
            >
              <Edit className="w-5 h-5" />
              Edit
            </Link>
          </div>
        </div>
      </Drawer>
    </header>
  );
}

function ThemeButton() {
  const [theme, setTheme] = useThemeState();
  return (
    <button
      className="flex items-center btn btn-ghost"
      disabled={!theme}
      onClick={() => {
        setTheme(theme === "dark" ? "light" : "dark");
      }}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}

// COOP/COEP headers for emscripten multi threading (SharedArrayBuffer)
export const headers: HeadersFunction = () => {
  return {
    headers: {
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "require-corp",
    },
  };
};

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
      {props.children}
      <Toaster />
    </>
  );
}
