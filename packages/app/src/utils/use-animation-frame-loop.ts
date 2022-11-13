import React from "react";
import { useStableRef } from "./use-stable-ref";

export function useAnimationFrameLoop(callback: () => void): void {
  const callbackRef = useStableRef(callback);

  React.useEffect(() => {
    let id: number | undefined = undefined;
    function loop() {
      id = requestAnimationFrame(loop);
      callbackRef.current();
    }
    loop();
    return () => {
      if (typeof id === "number") {
        cancelAnimationFrame(id);
      }
    };
  }, []);
}
