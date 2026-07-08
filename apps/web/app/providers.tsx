"use client";

import { useEffect, useState, type ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

function Providers({ children }: ProvidersProps) {
  const [isReady, setIsReady] = useState(
    process.env.NODE_ENV !== "development",
  );

  useEffect(() => {
    let isMounted = true;

    if (process.env.NODE_ENV !== "development") {
      return;
    }

    async function enableMocking() {
      const { worker } = await import("../mocks/browser");

      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: {
          url: "/mockServiceWorker.js",
        },
      });

      if (isMounted) {
        setIsReady(true);
      }
    }

    void enableMocking().catch(() => {
      if (isMounted) {
        setIsReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-6 text-sm text-muted-foreground">
        Preparing dashboard data...
      </div>
    );
  }

  return children;
}

export { Providers };
