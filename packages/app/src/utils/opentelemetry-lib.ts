import { AsyncLocalStorage } from "node:async_hooks";
import { Context, ContextManager, ROOT_CONTEXT } from "@opentelemetry/api";

//
// for workerd runtime compatibility
//

// remove "events" and "async_hooks" dependency from
// https://github.com/open-telemetry/opentelemetry-js/blob/06e919d6c909e8cc8e28b6624d9843f401d9b059/packages/opentelemetry-context-async-hooks/src/AsyncLocalStorageContextManager.ts#L17-L23
export class SimpleAsyncContextManager implements ContextManager {
  private storage = new AsyncLocalStorage<Context>();

  active(): Context {
    return this.storage.getStore() ?? ROOT_CONTEXT;
  }

  with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
    context: Context,
    fn: F,
    thisArg?: ThisParameterType<F>,
    ...args: A
  ): ReturnType<F> {
    return this.storage.run(context, () => fn.apply(thisArg, args));
  }

  bind<T>(_context: Context, _target: T): T {
    throw new Error("todo: ContextManager.bind");
  }

  enable(): this {
    return this;
  }

  disable(): this {
    return this;
  }
}
