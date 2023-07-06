import { RequestHandler } from "@hattip/compose";
import {
  Context,
  ContextManager,
  ROOT_CONTEXT,
  Span,
  SpanKind,
  SpanOptions,
  SpanStatusCode,
  context,
  trace,
} from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  WebTracerProvider,
} from "@opentelemetry/sdk-trace-web";
import {
  SemanticAttributes,
  SemanticResourceAttributes,
} from "@opentelemetry/semantic-conventions";
import { env } from "./worker-env";

/*
```sh
# see logs on console
OTEL_SERVICE_NAME=dev OTEL_TRACES_EXPORTER=console pnpm dev

# see logs on local jaeger
docker compose up jaeger  # open http://localhost:16686
OTEL_SERVICE_NAME=dev OTEL_TRACES_EXPORTER=otlp pnpm dev
```
*/

//
// init
//

let provider: WebTracerProvider;

export async function initializeOpentelemetry() {
  if (!env.OTEL_TRACES_EXPORTER) {
    return;
  }
  provider = new WebTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: env.OTEL_SERVICE_NAME ?? "",
    }),
  });

  const contextManager = new SimpleAsyncContextManager();
  provider.register({ contextManager });

  function getSpanProcessor() {
    switch (env.OTEL_TRACES_EXPORTER) {
      case "console": {
        return new SimpleSpanProcessor(new ConsoleSpanExporter());
      }
      case "otlp": {
        // TODO: allow configuration
        // OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.nr-data.net:4318
        // OTEL_EXPORTER_OTLP_TRACES_HEADERS=api-key=xxx
        return new BatchSpanProcessor(
          new OTLPTraceExporter({
            url: undefined,
            headers: {},
          })
        );
      }
    }
    throw new Error("invalid env.OTEL_TRACES_EXPORTER");
  }
  provider.addSpanProcessor(getSpanProcessor());
}

//
// simple port to remove "event" and "async_hooks" dependency from
// https://github.com/open-telemetry/opentelemetry-js/blob/06e919d6c909e8cc8e28b6624d9843f401d9b059/packages/opentelemetry-context-async-hooks/src/AsyncLocalStorageContextManager.ts#L17-L23
//

import { AsyncLocalStorage } from "node:async_hooks";

class SimpleAsyncContextManager implements ContextManager {
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

//
// utils
//

export async function traceAsync<T>(
  meta: {
    name: string;
    options?: SpanOptions;
  },
  asyncFn: (span: Span) => T
): Promise<Awaited<T>> {
  const span = trace.getTracer("default").startSpan(meta.name, meta.options);
  // redundant async/await to workaround typing
  return await context.with(trace.setSpan(context.active(), span), async () => {
    try {
      // span can be also accessed by `trace.getActiveSpan()`
      return await asyncFn(span);
    } catch (e) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(
        e instanceof Error ? e : new Error("unknown", { cause: e })
      );
      throw e;
    } finally {
      span.end();
    }
  });
}

//
// hattip
//

export function traceRequestHandler(): RequestHandler {
  return async (ctx) => {
    const { url } = ctx;
    return traceAsync(
      {
        name: `${ctx.method} ${url.pathname}`,
        options: {
          kind: SpanKind.SERVER,
          attributes: {
            [SemanticAttributes.HTTP_METHOD]: ctx.method,
            [SemanticAttributes.HTTP_SCHEME]: url.protocol.slice(0, -1),
            [SemanticAttributes.HTTP_TARGET]: url.pathname + url.search,
            [SemanticAttributes.HTTP_CLIENT_IP]: ctx.ip,
            [SemanticAttributes.NET_HOST_NAME]: url.hostname,
            [SemanticAttributes.NET_HOST_PORT]: url.port,
          },
        },
      },
      async (span) => {
        const response = await ctx.next();
        span.setAttributes({
          [SemanticAttributes.HTTP_STATUS_CODE]: response.status,
        });
        return response;
      }
    );
  };
}
