import { json } from "../utils/handler-utils";

export function get() {
  return json(null, { status: 204 });
}
