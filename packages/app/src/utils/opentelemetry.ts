import { RequestHandler } from "@hattip/compose";
import {
  Span,
  SpanKind,
  SpanOptions,
  SpanStatusCode,
  context,
  trace,
} from "@opentelemetry/api";
import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  WebTracerProvider,
} from "@opentelemetry/sdk-trace-web";
import { SemanticAttributes } from "@opentelemetry/semantic-conventions";
import { env } from "./worker-env";

// TODO:
// - async context
// - exporter to otlp/http/json endpoint

/*
```sh
# see logs on console
OTEL_SERVICE_NAME=dev OTEL_TRACES_EXPORTER=console pnpm dev

# see logs on local jaeger
docker-compose up jaeger  # open http://localhost:16686
OTEL_SERVICE_NAME=dev OTEL_TRACES_EXPORTER=otlp OTEL_EXPORTER_OTLP_TRACES_PROTOCOL=http/json pnpm dev
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
  provider = new WebTracerProvider();
  provider.register({ contextManager: undefined, propagator: undefined });
  provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
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
