function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <span className="font-medium text-foreground">Gridframe</span>
        <div className="flex items-center gap-4">
          <a
            className="flex min-h-11 min-w-11 items-center justify-center transition-colors hover:text-foreground sm:min-h-0 sm:min-w-0"
            href="https://www.npmjs.com/package/@gridframe/react"
            rel="noreferrer"
            target="_blank"
          >
            npm
          </a>
          <a
            className="flex min-h-11 items-center transition-colors hover:text-foreground sm:min-h-0"
            href="https://github.com/chrislaughlin/gridframe"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

export { SiteFooter };
