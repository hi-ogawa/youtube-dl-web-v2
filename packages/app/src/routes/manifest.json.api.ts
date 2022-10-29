import ICON192_URL from "../assets/icon-192.png?url";
import ICON512_URL from "../assets/icon-512.png?url";
import { json } from "../utils/handler-utils";

export const SHARE_TARGET_PARAMS = {
  title: "share-target-title",
  url: "share-target-url",
  text: "share-target-text",
};

export function get() {
  return json({
    short_name: "youtube-dl-web-v2",
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
  });
}
