// https://github.com/open-telemetry/opentelemetry-js
// https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-sdk-trace-base
// https://github.com/open-telemetry/opentelemetry-js-contrib
// https://docs.newrelic.com/docs/more-integrations/open-source-telemetry-integrations/opentelemetry/opentelemetry-setup

import { NodeSDK, api, tracing } from "@opentelemetry/sdk-node";

// set flag globally for dev hmr
declare global {
  var __OTEL_INITIALIZED__: any;
}

export async function initializeOtel() {
  if (global.__OTEL_INITIALIZED__) return;
  global.__OTEL_INITIALIZED__ = true;

  const sdk = new NodeSDK({
    traceExporter: new tracing.ConsoleSpanExporter(),
  });
  await sdk.start();
  new tracing.BasicTracerProvider().register();
  console.log("OTEL is ready");
}

export function getTracer() {
  return api.trace.getTracer("default-tracer");
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
