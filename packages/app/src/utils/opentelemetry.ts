import { RequestHandler } from "@hattip/compose";
import {
  DiagConsoleLogger,
  DiagLogLevel,
  Span,
  SpanKind,
  SpanOptions,
  SpanStatusCode,
  context,
  diag,
  trace,
} from "@opentelemetry/api";
import { baggageUtils } from "@opentelemetry/core";
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
import { SimpleAsyncContextManager } from "./opentelemetry-lib";
import { env } from "./worker-env";

/*
```sh
# see logs on console
OTEL_TRACES_EXPORTER=console pnpm dev

# see logs on local jaeger
docker compose up jaeger  # open http://localhost:16686
OTEL_TRACES_EXPORTER=otlp pnpm dev
```
*/

//
// init
//

let provider: WebTracerProvider | undefined;

export async function initializeOpentelemetry() {
  if (!env.OTEL_TRACES_EXPORTER) {
    return;
  }

  // debug
  if (false as boolean) {
    diag.setLogger(new DiagConsoleLogger(), { logLevel: DiagLogLevel.ALL });
  }

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]:
      env.OTEL_SERVICE_NAME ?? "youtube-dl-web-unknown",
  });
  const contextManager = new SimpleAsyncContextManager();
  const spanProcessor = getSpanProcessor(env.OTEL_TRACES_EXPORTER);

  provider = new WebTracerProvider({ resource });
  provider.register({ contextManager });
  provider.addSpanProcessor(spanProcessor);

  //
  // helpers
  //

  function getSpanProcessor(type: string) {
    switch (type) {
      case "console": {
        return new SimpleSpanProcessor(new ConsoleSpanExporter());
      }
      case "otlp": {
        // cf. https://github.com/open-telemetry/opentelemetry-js/blob/68039c55ecc7f8ff6af15c5c430d9202b6bf9f8b/experimental/packages/exporter-trace-otlp-http/src/platform/browser/OTLPTraceExporter.ts#L36
        const url =
          (env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318") +
          "/v1/traces";
        const headers = baggageUtils.parseKeyPairsIntoRecord(
          env.OTEL_EXPORTER_OTLP_TRACES_HEADERS
        );
        const exporter = new OTLPTraceExporter({
          url,
          headers,
        });
        return new BatchSpanProcessor(exporter);
      }
    }
    throw new Error("invalid OTEL_TRACES_EXPORTER");
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
  // need redundant async/await to workaround typing
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

type SpanMetaFn<F extends (...args: any[]) => any> = (
  ...args: Parameters<F>
) => {
  name: string;
  options?: SpanOptions;
};

export function wrapTraceAsync<F extends (...args: any[]) => any>(
  asyncFn: F,
  spanMetaFn: SpanMetaFn<F>
): F {
  function wrapper(this: unknown, ...args: Parameters<F>) {
    return traceAsync(spanMetaFn(...args), () => asyncFn.apply(this, args));
  }
  return wrapper as F;
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

export function traceForceFlushHandler(): RequestHandler {
  return async (ctx) => {
    try {
      return await ctx.next();
    } finally {
      if (provider) {
        ctx.waitUntil(provider.forceFlush());
      }
    }
  };
}
