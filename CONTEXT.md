# Gridframe

Gridframe is a dashboard framework for building reusable, configurable dashboard experiences. This context defines the product language used for dashboard configuration and rendering.

## Language

**Dashboard**:
A composed analytics surface that presents multiple cards under one title and optional footer.
_Avoid_: Page, report, board

**Dashboard config**:
A JSON-style description of a dashboard's title, cards, and footer.
_Avoid_: Schema, manifest, layout

**Dashboard repository**:
The consumer-owned persistence boundary used by Gridframe server handlers to load and mutate Dashboards.
_Avoid_: Storage adapter, database service

**Card**:
A single dashboard unit with a name, visualization, query, and optional deeplink.
_Avoid_: Widget, tile, panel

**Card definition**:
The consumer-owned source of truth for a Card's library metadata, Visualization, default layout, and data.
_Avoid_: Widget definition, card schema

**Card library**:
The catalog of trusted Card templates available to add to a Dashboard.
_Avoid_: Widget gallery, component picker

**Dashboard seed**:
The initial Dashboard template used when a user has no saved Dashboard yet.
_Avoid_: Starter board, default config

**Card data resolver**:
The consumer-provided function that returns validated data for a Card.
_Avoid_: Fetcher, source adapter

**Query**:
The card-owned endpoint used to fetch the data for that card.
_Avoid_: Fetcher, datasource, request

**Visualization**:
The presentation type a card uses to render its fetched data.
_Avoid_: Chart type, renderer, view

**Deeplink**:
A link from a card to a more detailed destination for the same subject.
_Avoid_: Action, CTA, navigation

**Card footer**:
The bottom area of a card, used for the card's deeplink when one exists.
_Avoid_: Card action bar, card CTA

**Dashboard footer**:
The bottom area of a dashboard, used for global dashboard context or links.
_Avoid_: Page footer, app footer
