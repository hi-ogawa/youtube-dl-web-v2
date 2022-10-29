// satisfy minimal requirements for PWA
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
