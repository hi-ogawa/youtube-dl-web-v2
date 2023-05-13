import process from "node:process";
import type { RequestHandler } from "@hattip/compose";
import { once } from "@hiogawa/utils";
import {
  SpanKind,
  SpanOptions,
  SpanStatusCode,
  context,
  trace,
} from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SemanticAttributes } from "@opentelemetry/semantic-conventions";

/*

# how to test opentelemetry locally

```sh
# see logs on console
OTEL_TRACES_EXPORTER=console pnpm dev

# see logs on local jaeger
docker-compose up jaeger
OTEL_TRACES_EXPORTER=otlp OTEL_EXPORTER_OTLP_TRACES_PROTOCOL=http/json pnpm dev
```

# notes

by default, sdk uses TracerProviderWithEnvExporters to configure everything based on environment variables

  https://github.com/open-telemetry/opentelemetry-js/blob/db0ecc37683507c8ef25b07cfbb5f25b3e263a53/experimental/packages/opentelemetry-sdk-node/src/TracerProviderWithEnvExporter.ts#L27

for example,

  OTEL_TRACES_EXPORTER https://github.com/open-telemetry/opentelemetry-js/blob/db0ecc37683507c8ef25b07cfbb5f25b3e263a53/experimental/packages/opentelemetry-sdk-node/src/TracerProviderWithEnvExporter.ts#L69
  OTEL_EXPORTER_OTLP_PROTOCOL https://github.com/open-telemetry/opentelemetry-js/blob/db0ecc37683507c8ef25b07cfbb5f25b3e263a53/experimental/packages/opentelemetry-sdk-node/src/TracerProviderWithEnvExporter.ts#L54
  OTEL_EXPORTER_OTLP_ENDPOINT https://github.com/open-telemetry/opentelemetry-js/blob/db0ecc37683507c8ef25b07cfbb5f25b3e263a53/experimental/packages/exporter-trace-otlp-grpc/src/OTLPTraceExporter.ts#L68
  OTEL_SERVICE_NAME https://github.com/open-telemetry/opentelemetry-js/blob/db0ecc37683507c8ef25b07cfbb5f25b3e263a53/packages/opentelemetry-resources/src/detectors/EnvDetector.ts#L60

also note that it uses AsyncLocalStorageContextManager so that span context is propagated properly within promise chain

  https://github.com/open-telemetry/opentelemetry-js/blob/db0ecc37683507c8ef25b07cfbb5f25b3e263a53/packages/opentelemetry-sdk-trace-node/src/NodeTracerProvider.ts#L60-L66

## patch

to avoid bundling all the adapters referenced by `TracerProviderWithEnvExporter` (e.g. grpc, jeager),
we comment out `require` manually by patches/@opentelemetry__sdk-node@0.34.0.patch.

*/

const initializeOtel = once(async () => {
  if (!process.env["OTEL_TRACES_EXPORTER"]) return;

  const sdk = new NodeSDK();
  await sdk.start();
});

function getTracer() {
  return trace.getTracer("default");
}

export async function traceAsync<T>(
  asyncFn: () => T,
  spanName: string,
  spanOptions?: SpanOptions
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(spanName, spanOptions);
  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      return await asyncFn();
    } catch (e) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(e as any);
      throw e;
    } finally {
      span.end();
    }
  });
}

export function decorateTraceAsync<F extends (...args: any[]) => any>(
  asyncFn: F,
  metaFn: (...args: Parameters<F>) => {
    spanName: string;
    spanOptions?: SpanOptions;
  }
): F {
  const wrapper = (...args: Parameters<F>) => {
    const meta = metaFn(...args);
    return traceAsync(() => asyncFn(...args), meta.spanName, meta.spanOptions);
  };
  return wrapper as F;
}

export const traceRequestHanlder: RequestHandler = async (ctx) => {
  await initializeOtel();

  const { request, ip } = ctx;
  const url = new URL(request.url);
  // create span
  const span = getTracer().startSpan("request-handler", {
    kind: SpanKind.SERVER,
    // request attirbutes
    attributes: {
      [SemanticAttributes.HTTP_METHOD]: request.method,
      [SemanticAttributes.HTTP_SCHEME]: url.protocol.slice(0, -1),
      [SemanticAttributes.HTTP_TARGET]: url.pathname + url.search,
      [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      [SemanticAttributes.NET_HOST_NAME]: url.hostname,
      [SemanticAttributes.NET_HOST_PORT]: url.port,
    },
  });
  // wrap with context
  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const response = await ctx.next();
      // reponse attributes
      span.setAttributes({
        [SemanticAttributes.HTTP_STATUS_CODE]: response.status,
      });
      return response;
    } catch (e) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(e as any);
      throw e;
    } finally {
      span.end();
    }
  });
};
