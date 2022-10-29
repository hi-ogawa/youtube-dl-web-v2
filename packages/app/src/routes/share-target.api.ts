import type { RequestContext } from "rakkasjs";
import { redirect } from "../utils/handler-utils";

// see manifest.json
const KEY = "share-target-text";

export function get(ctx: RequestContext) {
  const url = new URL(ctx.request.url, "https://dummy");
  const value = url.searchParams.get(KEY);
  if (!value) {
    return redirect("/");
  }
  return redirect("/?" + new URLSearchParams({ id: value }));
}
