"use client";

import { useEffect } from "react";

const legacyWorkerPath = "/mockServiceWorker.js";
const reloadGuard = "gridframe-legacy-msw-cleanup";

export function LegacyServiceWorkerCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      const legacyRegistrations = registrations.filter((registration) =>
        [registration.active, registration.waiting, registration.installing]
          .filter((worker) => worker !== null)
          .some((worker) => new URL(worker.scriptURL).pathname === legacyWorkerPath),
      );
      await Promise.all(
        legacyRegistrations.map((registration) => registration.unregister()),
      );

      const controller = navigator.serviceWorker.controller;
      if (
        controller &&
        new URL(controller.scriptURL).pathname === legacyWorkerPath &&
        sessionStorage.getItem(reloadGuard) !== "done"
      ) {
        sessionStorage.setItem(reloadGuard, "done");
        window.location.reload();
      }
    });
  }, []);

  return null;
}
