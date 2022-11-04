export class TinyAssertionError extends Error {
  constructor(message?: string, stackStartFunction?: Function) {
    super(message);
    if ("captureStackTrace" in Error) {
      Error.captureStackTrace(this, stackStartFunction ?? TinyAssertionError);
    }
  }
}

export function tinyassert(value: any, message?: string): asserts value {
  if (!value) {
    throw new TinyAssertionError(message, tinyassert);
  }
}
