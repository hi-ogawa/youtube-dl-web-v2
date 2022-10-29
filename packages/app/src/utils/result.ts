export type Result<T, E> = { ok: true; value: T } | { ok: false; value: E };
export type Option<T> = { ok: true; value: T } | { ok: false };
