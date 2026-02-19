"use client"

import { KanbanColumnPending } from "./pending/kanban-column-pending"
import { KanbanColumnProducing } from "./producing/kanban-column-producing"

export function KanbanBoard() {
  return (<div className="grid h-full w-full grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3 p-6">
        <KanbanColumnPending />

        <KanbanColumnProducing />

        <KanbanColumn
          title="Andamento"
          items={[]}
          renderItem={(item) => null}
        />
      </div>)
}