import { newPromiseWithResolvers } from "@hiogawa/utils";

// https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/

export let turnstile: {
  ready: (f: () => void) => void;
  render: (
    el: HTMLElement,
    params: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback": (error: unknown) => void;
    }
  ) => string | undefined;
};

export async function loadTurnstileScript() {
  const { promise, resolve } = newPromiseWithResolvers<void>();
  const CALLBACK_NAME = "__onloadTurnstileCallback";
  const windowAny = window as any;
  windowAny[CALLBACK_NAME] = () => {
    turnstile = windowAny.turnstile;
    resolve();
  };
  await loadScript(
    `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=${CALLBACK_NAME}`
  );
  await promise;
}

async function loadScript(src: string): Promise<void> {
  const { promise, resolve, reject } = newPromiseWithResolvers<void>();
  const el = document.createElement("script");
  el.src = src;
  el.async = true;
  el.addEventListener("load", () => resolve());
  el.addEventListener("error", reject);
  document.body.appendChild(el);
  await promise;
}
