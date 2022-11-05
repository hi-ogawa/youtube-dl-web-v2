export type Result<T, E> = { ok: true; value: T } | { ok: false; value: E };

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function Err<T>(value: T): Result<never, T> {
  return { ok: false, value };
}

export function wrapError<T>(getValue: () => T): Result<T, unknown> {
  try {
    return Ok(getValue());
  } catch (e) {
    return Err(e);
  }
}
