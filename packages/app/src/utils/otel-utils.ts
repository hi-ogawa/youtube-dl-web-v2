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

let sdk: NodeSDK | undefined;

export async function initializeOtel() {
  if (!process.env["OTEL_TRACES_EXPORTER"]) return;

  sdk = new NodeSDK();
  await sdk.start();
}

export async function finalizeOtel() {
  await sdk?.shutdown();
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

type SpanMetaFn<F extends (...args: any[]) => any> = (
  ...args: Parameters<F>
) => {
  name: string;
  options?: SpanOptions;
};

export function wrapTraceAsync<F extends (...args: any[]) => any>(
  asyncFn: F,
  metaFn: SpanMetaFn<F>
): F {
  function wrapper(this: unknown, ...args: Parameters<F>) {
    return traceAsync(metaFn(...args), () => asyncFn.apply(this, args));
  }
  return wrapper as F;
}

type FunctionKeyOf<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

export function patchTraceAsync<T extends object, K extends FunctionKeyOf<T>>(
  patchee: T,
  key: K,
  metaFn: SpanMetaFn<T[K]>
) {
  const original = patchee[key] as any;
  function wrapper(this: T, ...args: Parameters<T[K]>) {
    return traceAsync(metaFn(...args), () => original.apply(this, args));
  }
  patchee[key] = wrapper as any;
}

export function patchPrototypeTraceAsync<
  T extends object,
  K extends FunctionKeyOf<T>
>(
  klass: { name: string; prototype: T },
  key: K,
  metaFn: SpanMetaFn<T[K]> = () => ({ name: `${klass.name}.${String(key)}` })
) {
  const original = klass.prototype[key] as any;
  function wrapper(this: T, ...args: Parameters<T[K]>) {
    return traceAsync(metaFn(...args), () => original.apply(this, args));
  }
  klass.prototype[key] = wrapper as any;
}

type PatchProxy<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (metaFn: SpanMetaFn<T[K]>) => void
    : never;
};

export function patchProxyTraceAsync<T>(patchee: T): PatchProxy<T> {
  return new Proxy(
    {},
    {
      get(_target, p, _receiver) {
        return (metaFn: any) => {
          patchTraceAsync(patchee as any, p as any, metaFn);
        };
      },
    }
  ) as any;
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
