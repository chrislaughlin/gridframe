import Link from "next/link";

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          className="font-semibold tracking-tight text-foreground"
          href="/"
        >
          Gridframe
        </Link>
        <nav className="flex items-center gap-6 text-sm">
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
            href="https://github.com/nicholasgriffintn/gridframe"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

export { SiteHeader };
