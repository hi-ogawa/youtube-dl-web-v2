// https://github.com/egoist/esbuild-register/issues/26#issuecomment-1173015785
// https://nodejs.org/docs/latest-v16.x/api/esm.html#loadurl-context-nextload

export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts")) {
    const result = await nextLoad(url, { format: "module" });
    return {
      ...result,
      format: "commonjs",
    };
  }
  return nextLoad(url, context);
}
