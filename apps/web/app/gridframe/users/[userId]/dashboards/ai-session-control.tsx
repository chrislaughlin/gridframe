"use client";

import { useState } from "react";

function DashboardAISessionControl({ userId }: { userId: string }) {
  const [accessToken, setAccessToken] = useState("");
  const [status, setStatus] = useState<string>();
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mx-auto flex w-full max-w-7xl flex-wrap items-end gap-3 px-4 pt-4 sm:px-6 lg:px-8"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setStatus(undefined);
        try {
          const response = await fetch("/api/gridframe/ai/session", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, accessToken }),
          });
          setStatus(
            response.ok
              ? "Dashboard AI enabled for this browser session."
              : "Dashboard AI authentication failed.",
          );
          if (response.ok) setAccessToken("");
        } catch {
          setStatus("Dashboard AI authentication failed.");
        } finally {
          setPending(false);
        }
      }}
    >
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        <span>Example AI access token</span>
        <input
          autoComplete="current-password"
          className="w-64 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          disabled={pending}
          onChange={(event) => setAccessToken(event.target.value)}
          type="password"
          value={accessToken}
        />
      </label>
      <button
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        disabled={pending || !accessToken}
        type="submit"
      >
        {pending ? "Enabling..." : "Enable Dashboard AI"}
      </button>
      {status ? (
        <span className="text-sm text-muted-foreground" role="status">
          {status}
        </span>
      ) : null}
    </form>
  );
}

export { DashboardAISessionControl };
