# PanelDashboard owns its first-pass query client

PanelDashboard creates and owns an internal TanStack Query client for the first pass so `<PanelDashboard config={config} />` works without host-app provider setup. We considered requiring the consuming app to provide `QueryClientProvider`, but that would make the initial framework less plug-and-play and shift a dashboard-specific setup concern onto the example app before shared cache integration is needed.
