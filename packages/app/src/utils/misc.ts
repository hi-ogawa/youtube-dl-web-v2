import type React from "react";

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
