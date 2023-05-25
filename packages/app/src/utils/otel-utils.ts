import process from "node:process";
import type { RequestHandler } from "@hattip/compose";
import {
  Span,
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

export async function initializeOtel() {
  if (!process.env["OTEL_TRACES_EXPORTER"]) return;

  const sdk = new NodeSDK();
  await sdk.start();
}

function getTracer() {
  return trace.getTracer("default");
}

export async function traceAsync<T>(
  meta: {
    name: string;
    options?: SpanOptions;
  },
  asyncFn: (span: Span) => T
): Promise<Awaited<T>> {
  const span = getTracer().startSpan(meta.name, meta.options);
  // redundant async/await to workaround typing
  return await context.with(trace.setSpan(context.active(), span), async () => {
    try {
      // span can be also accessed by `trace.getActiveSpan()`
      return await asyncFn(span);
    } catch (e) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(e as any);
      throw e;
    } finally {
      span.end();
    }
  });
}

export const traceRequestHanlder: RequestHandler = (ctx) => {
  const { url } = ctx;
  return traceAsync(
    {
      name: `${ctx.method} ${url.pathname}`, // TODO: resolve rakkasjs dynamic route
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
