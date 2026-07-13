# Versioned consumer manifest for agent skills

Gridframe's setup skill writes a `gridframe.json` manifest beside each integrated application, and maintenance skills use its versioned paths to locate Card definitions, the Dashboard seed, handlers, persistence, routes, and the rendered Dashboard. We chose this explicit contract over fixed filenames or repeated heuristic searches because Gridframe is framework-neutral and consumer layouts vary; versioning gives future manifest changes a migration boundary.
