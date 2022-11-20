import process from "node:process";
import _ from "lodash";
import { json } from "../../utils/handler-utils";

// dump nodejs runtime information

export async function get() {
  return json({
    process: {
      versions: process.versions,
      env: sortRecord(process.env),
    },
  });
}

function sortRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(_.sortBy(Object.entries(record), ([k, _]) => k));
}
