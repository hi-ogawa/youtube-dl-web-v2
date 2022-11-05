import React from "react";
import { useHydrated } from "./use-hydrated";

export function useThemeState() {
  const hydrated = useHydrated();
  const [state, setState] = React.useState(
    hydrated ? __getTheme : () => undefined
  );

  function setStateWrapper(state: string) {
    setState(state);
    __setTheme(state);
  }

  React.useEffect(() => {
    setState(__getTheme());
  }, [hydrated]);

  return [state, setStateWrapper] as const;
}
