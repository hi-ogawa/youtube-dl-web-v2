export function get() {
  return new Response(SERVICE_WORKER_CODE, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
    },
  });
}

// satisfy minimal requirements for PWA?
const SERVICE_WORKER_CODE = `\
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
`;
