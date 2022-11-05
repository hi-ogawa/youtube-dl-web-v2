import React from "react";

let _hydrated = false;

export function useHydrated() {
  const [hydrated, setHydrated] = React.useState(_hydrated);

  React.useEffect(() => {
    _hydrated = true;
    setHydrated(true);
  }, []);

  return hydrated;
}
