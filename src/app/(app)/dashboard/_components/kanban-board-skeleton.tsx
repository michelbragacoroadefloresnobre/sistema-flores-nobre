import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function KanbanBoardSkeleton() {
  return (
    <div className="grid h-full w-full grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3 p-6">
      <KanbanColumnSkeleton title="Produção" />
      <KanbanColumnSkeleton title="Andamento" />
      <KanbanColumnSkeleton title="Entrega" />
    </div>
  );
}

export function KanbanColumnSkeleton({ title }: { title: string }) {
  return (
    <Card className="overflow-hidden rounded-xl border-border bg-card shadow-sm">
      {/* Header matching the real component structure */}
      <CardHeader className="relative flex flex-auto shrink-0 grow-0 flex-row items-center justify-between border-b border-border bg-muted/50 py-3">
        <CardTitle className="flex items-center gap-2">
          {/* Title Text */}
          <span className="font-bold text-foreground">{title}</span>
          {/* Count Badge (matches the '({items.length})' ) */}
          <Skeleton className="h-4 w-6 rounded-sm" />
        </CardTitle>

        {/* Right side stats (Total Value & Average Ticket) */}
        <div className="space-y-1">
          {/* Mimicking: rounded-sm border border-border bg-background px-2 py-0.5 */}
          <div className="flex items-center rounded-sm border border-border bg-background px-2 py-0.5">
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex items-center rounded-sm border border-border bg-background px-2 py-0.5">
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>

      {/* Content Area */}
      <CardContent className="scrollbar flex-auto shrink-0 grow-0 overflow-y-scroll px-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <KanbanItemSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanItemSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          {/* Order ID/Tag */}
          <Skeleton className="h-3 w-12 rounded-full" />
          {/* Main Title/Name */}
          <Skeleton className="h-4 w-32" />
        </div>
        {/* Action Button/Menu */}
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2">
        {/* Date/Info */}
        <Skeleton className="h-3 w-20" />
        {/* Price Tag */}
        <Skeleton className="h-5 w-16 rounded-sm" />
      </div>
    </div>
  );
}
