"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function OccasionDeleteButton({
  occasionId,
  onDeleted,
}: {
  occasionId: string;
  onDeleted: () => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      await axios.delete(`/api/occasions/${occasionId}`);
      toast.success("Ocasião removida com sucesso");
      setOpen(false);
      onDeleted();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Erro ao excluir ocasião.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover ocasião?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. A ocasião será removida
            permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            variant="destructive"
          >
            {isPending ? "Removendo..." : "Remover"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
