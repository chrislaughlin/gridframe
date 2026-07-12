function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <span className="font-medium text-foreground">Gridframe</span>
        <div className="flex items-center gap-4">
          <a
            className="transition-colors hover:text-foreground"
            href="https://www.npmjs.com/package/@gridframe/react"
            rel="noreferrer"
            target="_blank"
          >
            npm
          </a>
          <a
            className="transition-colors hover:text-foreground"
            href="https://github.com/nicholasgriffintn/gridframe"
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
