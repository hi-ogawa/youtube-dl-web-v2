const SERVICE_WORKER_URL = "/service-worker.js";

export async function registerServiceWorker() {
  if (window.navigator.serviceWorker) {
    await window.navigator.serviceWorker.register(SERVICE_WORKER_URL);
  }
}
