import ICON192_URL from "../assets/icon-192.png?url";
import ICON512_URL from "../assets/icon-512.png?url";
import { PRESET_HEADERS, json } from "../utils/handler-utils";

export function get() {
  return json(MANIFEST_JSON, {
    headers: PRESET_HEADERS.CACHE_CDN,
  });
}

export const SHARE_TARGET_PARAMS = {
  title: "share-target-title",
  url: "share-target-url",
  text: "share-target-text",
};

const MANIFEST_JSON = {
  short_name: "Youtube DL Web",
  name: "Youtube DL Web",
  icons: [
    {
      src: ICON192_URL,
      type: "image/png",
      sizes: "192x192",
    },
    {
      src: ICON512_URL,
      type: "image/png",
      sizes: "512x512",
    },
  ],
  id: "/",
  start_url: "/",
  scope: "/",
  theme_color: "#FFFFFF",
  background_color: "#FFFFFF",
  display: "standalone",
  share_target: {
    action: "/",
    method: "GET",
    enctype: "application/x-www-form-urlencoded",
    params: SHARE_TARGET_PARAMS,
  },
};
