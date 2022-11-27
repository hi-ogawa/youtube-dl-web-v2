import process from "node:process";
import type { RequestHandler } from "@hattip/compose";
import { trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import {
  SemanticAttributes,
  SemanticResourceAttributes,
} from "@opentelemetry/semantic-conventions";

// https://github.com/open-telemetry/opentelemetry-js
// https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-sdk-trace-base
// https://github.com/open-telemetry/opentelemetry-js/tree/db0ecc37683507c8ef25b07cfbb5f25b3e263a53/experimental/packages/exporter-trace-otlp-http
// https://github.com/open-telemetry/opentelemetry-js-contrib
// https://docs.newrelic.com/docs/more-integrations/open-source-telemetry-integrations/opentelemetry/opentelemetry-setup

// set flag globally for dev hmr
declare global {
  var __OTEL_INITIALIZED__: any;
}

export async function initializeOtel() {
  if (global.__OTEL_INITIALIZED__) return;
  global.__OTEL_INITIALIZED__ = true;

  // switch exporter based on standard environment variables https://github.com/open-telemetry/opentelemetry-js/blob/db0ecc37683507c8ef25b07cfbb5f25b3e263a53/experimental/packages/opentelemetry-sdk-node/src/TracerProviderWithEnvExporter.ts#L48-L55
  const traceExporter =
    process.env["OTEL_EXPORTER_OTLP_TRACES_PROTOCOL"] === "http/json"
      ? new OTLPTraceExporter() // uses OTEL_EXPORTER_OTLP_TRACES_ENDPOINT (default is http://localhost:4318)
      : new ConsoleSpanExporter();

  // for dev logging purpose, it would be mis-leading to not patch
  const spanProcessor =
    traceExporter instanceof ConsoleSpanExporter
      ? new SimpleSpanProcessor(traceExporter)
      : new BatchSpanProcessor(traceExporter);

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "youtube-dl-web",
  });

  const sdk = new NodeSDK({
    traceExporter,
    spanProcessor,
    resource,
  });
  await sdk.start();

  const provider = new BasicTracerProvider();
  provider.register();
}

export function getTracer() {
  return trace.getTracer("default-tracer");
}

export async function traceSpanPromise<T>(
  spanName: string,
  promise: Promise<T>
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(spanName);
  try {
    return await promise;
  } catch (e) {
    span.recordException(e as any);
    throw e;
  } finally {
    span.end();
  }
}

export const traceRequestHanlder: RequestHandler = async (ctx) => {
  const { locals, request, ip } = ctx;
  const span = getTracer().startSpan("request-handler");
  // TODO: inject span context to propagate?
  locals;
  // request attirbutes (https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/trace/semantic_conventions/http.md)
  const url = new URL(request.url);
  span.setAttributes({
    [SemanticAttributes.HTTP_METHOD]: request.method,
    [SemanticAttributes.HTTP_SCHEME]: url.protocol.slice(0, -1),
    [SemanticAttributes.HTTP_TARGET]: url.pathname + url.search,
    [SemanticAttributes.HTTP_CLIENT_IP]: ip,
  });
  try {
    const response = await ctx.next();
    // reponse attributes
    span.setAttributes({
      [SemanticAttributes.HTTP_STATUS_CODE]: response.status,
    });
    return response;
  } finally {
    span.end();
  }
};
