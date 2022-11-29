import process from "node:process";
import type { RequestHandler } from "@hattip/compose";
import {
  SpanKind,
  SpanOptions,
  SpanStatusCode,
  context,
  trace,
} from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { SemanticAttributes } from "@opentelemetry/semantic-conventions";

// https://github.com/open-telemetry/opentelemetry-js
// https://github.com/open-telemetry/opentelemetry-js/tree/main/examples
// https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-sdk-trace-base
// https://github.com/open-telemetry/opentelemetry-js/tree/db0ecc37683507c8ef25b07cfbb5f25b3e263a53/experimental/packages/exporter-trace-otlp-http
// https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-context-zone-peer-dep
// https://github.com/open-telemetry/opentelemetry-js-contrib
// https://github.com/open-telemetry/opentelemetry-js-contrib/blob/main/plugins/node/opentelemetry-instrumentation-fastify/src/instrumentation.ts
// https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/trace/api.md
// https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/trace/semantic_conventions/http.md
// https://docs.newrelic.com/docs/more-integrations/open-source-telemetry-integrations/opentelemetry/opentelemetry-setup

// set flag globally for dev hmr
declare global {
  var __OTEL_INITIALIZED__: any;
}

export async function initializeOtel() {
  if (global.__OTEL_INITIALIZED__) return;
  global.__OTEL_INITIALIZED__ = true;

  // switch exporter based on standard environment variables https://github.com/open-telemetry/opentelemetry-js/blob/db0ecc37683507c8ef25b07cfbb5f25b3e263a53/experimental/packages/opentelemetry-sdk-node/src/TracerProviderWithEnvExporter.ts#L48-L55
  // - OTEL_EXPORTER_OTLP_TRACES_PROTOCOL
  const traceExporter =
    process.env["OTEL_EXPORTER_OTLP_TRACES_PROTOCOL"] === "http/json"
      ? // configurable environment variables https://github.com/open-telemetry/opentelemetry-js/blob/db0ecc37683507c8ef25b07cfbb5f25b3e263a53/experimental/packages/exporter-trace-otlp-http/src/platform/node/OTLPTraceExporter.ts#L33-L61
        // - OTEL_EXPORTER_OTLP_ENDPOINT (e.g. https://otlp.nr-data.net:4318) (default is http://localhost:4318)
        // - OTEL_EXPORTER_OTLP_TRACES_HEADERS (e.g. api-key=xxx)
        new OTLPTraceExporter()
      : new ConsoleSpanExporter();

  const spanProcessor =
    traceExporter instanceof ConsoleSpanExporter
      ? new SimpleSpanProcessor(traceExporter)
      : new BatchSpanProcessor(traceExporter);

  // notable default behaviors
  // - resouce name is auto detected via OTEL_SERVICE_NAME https://github.com/open-telemetry/opentelemetry-js/blob/db0ecc37683507c8ef25b07cfbb5f25b3e263a53/packages/opentelemetry-resources/src/detectors/EnvDetector.ts#L60
  // - internally `NodeTracerProvider` is used by default which enables AsyncLocalStorageContextManager automatically
  const sdk = new NodeSDK({
    traceExporter,
    spanProcessor,
  });
  await sdk.start();
}

function getTracer() {
  return trace.getTracer("default");
}

export async function tracePromise<T>(
  promise: Promise<T>,
  spanName: string,
  spanOptions?: SpanOptions
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(spanName, spanOptions);
  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      return await promise;
    } catch (e) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(e as any);
      throw e;
    } finally {
      span.end();
    }
  });
}

export const traceRequestHanlder: RequestHandler = async (ctx) => {
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
