import { tinyassert } from "./tinyassert";

export function ignoreFormEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation();
  }
}

const BYTE_UNITS: [number, string][] = [
  [10 ** 9, "GB"],
  [10 ** 6, "MB"],
  [10 ** 3, "KB"],
];

export function formatBytes(x: number): string {
  for (const [scale, suffix] of BYTE_UNITS) {
    if (x >= scale) {
      return (x / scale).toPrecision(3) + suffix;
    }
  }
  return String(x) + "B";
}

export function cls(...args: any[]): string {
  return args.filter(Boolean).join(" ");
}

// hh:mm:ss.xxx
const r = String.raw;
const TIMESTAMP_RE = r`(\d{1,2}:)?\d{1,2}:\d{1,2}(\.\d+)?`;
const TIMESTAMP_RE_EXACT = new RegExp(r`^` + TIMESTAMP_RE + r`$`);
const TIMESTAMP_RE_EXTRACT = new RegExp(r`\b` + TIMESTAMP_RE + r`\b`, "g");

export function parseTimestamp(time: string): number {
  tinyassert(time.match(TIMESTAMP_RE_EXACT), "invalid timestamp");

  const components = time.split(":");
  tinyassert(components.length >= 1);

  let [hh, mm, ssxxx] = components;
  if (components.length === 2) {
    [hh, mm, ssxxx] = ["00", hh, mm];
  } else if (components.length === 1) {
    [hh, mm, ssxxx] = ["00", "00", hh];
  }

  const [ss, xxx] = ssxxx.split(".");
  return (
    (Number(hh) * 60 + Number(mm)) * 60 + Number(ss) + Number(xxx ?? 0) / 1000
  );
}

export function formatTimestamp(s: number): string {
  const ms = (s * 1000) % 1000;
  let m = s / 60;
  s = s % 60;
  let h = m / 60;
  m = m % 60;
  return `${printf(h, 2)}:${printf(m, 2)}:${printf(s, 2)}.${printf(ms, 3)}`;
}

// printf "%0Nd"
function printf(value: number, N: number): string {
  return String(Math.floor(value)).padStart(N, "0");
}

export function extractTimestamps(text: string): string[] {
  return Array.from(text.matchAll(TIMESTAMP_RE_EXTRACT), (m) => m[0]);
}
