import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Head } from "rakkasjs";
import React from "react";
import { Toaster } from "react-hot-toast";
import ICON_URL from "../assets/icon-32.png?url";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <>
      <Head>
        <title>Youtube DL Web</title>
        <link rel="icon" href={ICON_URL} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <AppProvider>{props.children}</AppProvider>
    </>
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
      {props.children}
      <Toaster />
    </>
  );
}
