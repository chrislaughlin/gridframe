"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { applyDashboardProposal, proposeDashboard } from "@gridframe/client";
import type {
  DashboardAction,
  DashboardDocument,
  DashboardProposalPreviewCard,
} from "@gridframe/core";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./internal/ui";

type DashboardAIDialogProps = {
  userId: string;
  apiBaseUrl?: string;
  dashboard: DashboardDocument;
  disabled: boolean;
  onDashboardChange: (dashboard: DashboardDocument) => void;
};

function DashboardAIDialog({
  userId,
  apiBaseUrl,
  dashboard,
  disabled,
  onDashboardChange,
}: DashboardAIDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [target, setTarget] = React.useState<"edit" | "create">("edit");
  const [preview, setPreview] =
    React.useState<Awaited<ReturnType<typeof proposeDashboard>>>();
  const generate = useMutation({
    mutationFn: (request: { prompt: string; target: "edit" | "create" }) =>
      proposeDashboard({
        userId,
        apiBaseUrl,
        prompt: request.prompt,
        dashboardId: request.target === "edit" ? dashboard.id : undefined,
        revision: request.target === "edit" ? dashboard.revision : undefined,
      }),
    onMutate: () => {
      setPreview(undefined);
    },
    onSuccess: setPreview,
  });
  const apply = useMutation({
    mutationFn: () => {
      if (!preview) throw new Error("Generate a proposal before applying it");
      return applyDashboardProposal({
        userId,
        apiBaseUrl,
        dashboardId: preview.dashboardId,
        revision: preview.revision,
        proposal: preview.proposal,
      });
    },
    onSuccess: (updated) => {
      onDashboardChange(updated);
      setOpen(false);
      setPrompt("");
      setTarget("edit");
      setPreview(undefined);
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen && !apply.isPending) {
      setPrompt("");
      setTarget("edit");
      setPreview(undefined);
      generate.reset();
      apply.reset();
    }
  }

  const pending = generate.isPending || apply.isPending;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button disabled={disabled} variant="outline">
          Create with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(48rem,calc(100vh-2rem))] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Plan Dashboard changes</DialogTitle>
          <DialogDescription>
            Describe the result you want. Gridframe will validate a preview
            before anything is saved.
          </DialogDescription>
        </DialogHeader>

        <div
          aria-label="AI Dashboard target"
          className="flex gap-2"
          role="group"
        >
          <Button
            disabled={pending}
            onClick={() => setTarget("edit")}
            type="button"
            variant={target === "edit" ? "secondary" : "outline"}
          >
            Edit current Dashboard
          </Button>
          <Button
            disabled={pending}
            onClick={() => setTarget("create")}
            type="button"
            variant={target === "create" ? "secondary" : "outline"}
          >
            Create new Dashboard
          </Button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const request = prompt.trim();
            if (request) {
              apply.reset();
              generate.mutate({ prompt: request, target });
            }
          }}
        >
          <label className="grid gap-2 text-sm font-medium">
            <span>Describe your dashboard changes</span>
            <textarea
              className="min-h-28 resize-y rounded-md border border-input bg-background px-3 py-2 font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={pending}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Add revenue KPIs, a monthly trend, and recent orders..."
              value={prompt}
            />
          </label>
          <Button disabled={pending || !prompt.trim()} type="submit">
            {generate.isPending ? "Generating..." : "Generate preview"}
          </Button>
        </form>

        {generate.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not generate a proposal</AlertTitle>
            <AlertDescription>{generate.error.message}</AlertDescription>
          </Alert>
        ) : null}

        {preview ? (
          <DashboardProposalPreview dashboard={dashboard} preview={preview} />
        ) : null}

        {apply.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not apply the proposal</AlertTitle>
            <AlertDescription>{apply.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button
            disabled={pending}
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            disabled={!preview?.validation.canApply || pending}
            onClick={() => apply.mutate()}
            type="button"
          >
            {apply.isPending ? "Applying..." : "Apply proposal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type DashboardProposalPreviewProps = {
  dashboard: DashboardDocument;
  preview: Awaited<ReturnType<typeof proposeDashboard>>;
};

function DashboardProposalPreview({
  dashboard,
  preview,
}: DashboardProposalPreviewProps) {
  return (
    <section aria-labelledby="dashboard-ai-preview-title" className="space-y-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold" id="dashboard-ai-preview-title">
            {preview.proposal.title}
          </h3>
          <Badge variant={preview.validation.canApply ? "secondary" : "muted"}>
            {preview.validation.canApply ? "Ready to apply" : "Review needed"}
          </Badge>
        </div>
        {preview.proposal.explanation ? (
          <p className="text-sm text-muted-foreground">
            {preview.proposal.explanation}
          </p>
        ) : null}
      </div>

      {preview.validation.errors.length ? (
        <Alert variant="destructive">
          <AlertTitle>Validation errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-5">
              {preview.validation.errors.map((error) => (
                <li key={`${error.code}:${error.path.join(".")}`}>
                  {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {preview.proposal.missingInformation.length ? (
        <Alert>
          <AlertTitle>Missing information</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-5">
              {preview.proposal.missingInformation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="gap-3 py-4">
        <CardContent className="space-y-3 px-4">
          <h4 className="text-sm font-medium">Proposed changes</h4>
          <ul className="space-y-2 text-sm">
            {preview.proposal.actions.map((action, index) => (
              <li
                className="flex items-center gap-2"
                key={actionKey(action, index)}
              >
                <Badge variant="outline">{actionBadge(action)}</Badge>
                <span>{actionLabel(action, dashboard)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {preview.preview.cards.length ? (
        <ProposedCardLayout cards={preview.preview.cards} />
      ) : null}

      {preview.proposal.assumptions.length ? (
        <div className="space-y-2 text-sm">
          <h4 className="font-medium">Assumptions</h4>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {preview.proposal.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function ProposedCardLayout({
  cards,
}: {
  cards: DashboardProposalPreviewCard[];
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Proposed Card layout</h4>
      <div className="grid min-h-36 grid-cols-4 auto-rows-8 gap-2 rounded-md border border-dashed border-border bg-muted/20 p-2">
        {cards.map((card) => (
          <div
            className="flex min-h-16 flex-col items-center justify-center gap-1 rounded border border-border bg-card p-2 text-center text-xs font-medium shadow-xs data-[removed=true]:border-dashed data-[removed=true]:opacity-50"
            data-removed={card.changes.includes("removed")}
            key={`${card.id ?? card.cardKey}:${card.title}`}
            style={{
              gridColumn: `${card.layout.x + 1} / span ${Math.min(card.layout.width, 4)}`,
              gridRow: `${card.layout.y + 1} / span ${Math.max(1, Math.ceil(card.layout.height / 2))}`,
            }}
          >
            <span>{card.title}</span>
            <span className="font-normal text-muted-foreground">
              {card.changes.join(" · ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function actionLabel(action: DashboardAction, dashboard: DashboardDocument) {
  const cardName = (cardId: string) =>
    dashboard.config.cards.find((card) => card.id === cardId)?.name ?? cardId;
  switch (action.type) {
    case "createDashboard":
      return `Set Dashboard title to ${action.title}`;
    case "updateDashboardMetadata":
      return "Update Dashboard details";
    case "addCard":
      return `Add ${action.card.title}`;
    case "updateCard":
      return `Update ${cardName(action.cardId)}`;
    case "removeCard":
      return `Remove ${cardName(action.cardId)}`;
    case "moveCard":
      return `Move ${cardName(action.cardId)}`;
    case "resizeCard":
      return `Resize ${cardName(action.cardId)}`;
    case "addGlobalFilter":
      return `Add ${action.filter.label ?? action.filter.field} filter`;
    case "removeGlobalFilter":
      return `Remove filter ${action.filterId}`;
  }
}

function actionBadge(action: DashboardAction) {
  return action.type.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function actionKey(action: DashboardAction, index: number) {
  if ("cardId" in action) return `${action.type}:${action.cardId}:${index}`;
  if (action.type === "addCard")
    return `${action.type}:${action.card.cardKey}:${index}`;
  if (action.type === "removeGlobalFilter") {
    return `${action.type}:${action.filterId}:${index}`;
  }
  return `${action.type}:${index}`;
}

export { DashboardAIDialog };
export type { DashboardAIDialogProps };
