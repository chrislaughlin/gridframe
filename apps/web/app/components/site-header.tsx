import Link from "next/link";

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          className="flex min-h-11 items-center font-semibold tracking-tight text-foreground sm:min-h-0"
          href="/"
        >
          Gridframe
        </Link>
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          <Link
            className="text-muted-foreground transition-colors hover:text-foreground"
            href="/examples"
          >
            Examples
          </Link>
          <Link
            className="text-muted-foreground transition-colors hover:text-foreground"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <a
            className="text-muted-foreground transition-colors hover:text-foreground"
            href="https://github.com/chrislaughlin/gridframe/blob/main/docs/ai-dashboards.md"
            rel="noreferrer"
            target="_blank"
          >
            Docs
          </a>
          <a
            className="text-muted-foreground transition-colors hover:text-foreground"
            href="https://github.com/chrislaughlin/gridframe"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </nav>
        <details className="group relative sm:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-md px-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <nav className="absolute right-0 top-full mt-2 flex min-w-40 flex-col rounded-md border border-border bg-background p-1 text-sm shadow-lg">
            <Link
              className="flex min-h-11 items-center rounded-sm px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              href="/examples"
            >
              Examples
            </Link>
            <Link
              className="flex min-h-11 items-center rounded-sm px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <a
              className="flex min-h-11 items-center rounded-sm px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              href="https://github.com/chrislaughlin/gridframe/blob/main/docs/ai-dashboards.md"
              rel="noreferrer"
              target="_blank"
            >
              Docs
            </a>
            <a
              className="flex min-h-11 items-center rounded-sm px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              href="https://github.com/chrislaughlin/gridframe"
              rel="noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </nav>
        </details>
      </div>
    </header>
  );
}

export { SiteHeader };
