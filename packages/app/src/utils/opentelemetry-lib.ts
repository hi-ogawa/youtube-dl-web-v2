import { AsyncLocalStorage } from "node:async_hooks";
import {
  Context,
  ContextManager,
  ROOT_CONTEXT,
  diag,
} from "@opentelemetry/api";

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

  bind<T>(_context: Context, target: T): T {
    // this api seems only for minor nodejs specific use case e.g. grpc, http etc..
    // https://github.com/open-telemetry/opentelemetry-js/blob/cab31aadb14c3e3ff3dda3e501234e717f1461e2/experimental/packages/opentelemetry-instrumentation-http/src/http.ts#L353
    // https://github.com/open-telemetry/opentelemetry-js/blob/cab31aadb14c3e3ff3dda3e501234e717f1461e2/experimental/packages/opentelemetry-instrumentation-grpc/src/grpc-js/clientUtils.ts#L109
    diag.warn("SimpleAsyncContextManager.bind is unsupported");
    return target;
  }

  enable(): this {
    return this;
  }

  disable(): this {
    return this;
  }
}
