import React from "react";
import { useHydrated } from "./use-hydrated";

export function useThemeState() {
  const hydrated = useHydrated() && typeof window !== "undefined";
  const [state, setState] = React.useState(
    hydrated ? __getTheme : () => undefined
  );

  function setStateWrapper(state: string) {
    if (!hydrated) {
      return;
    }
    setState(state);
    __setTheme(state);
  }

  React.useEffect(() => {
    if (!hydrated) {
      return;
    }
    setState(__getTheme());
  }, [hydrated]);

  return [state, setStateWrapper] as const;
}
