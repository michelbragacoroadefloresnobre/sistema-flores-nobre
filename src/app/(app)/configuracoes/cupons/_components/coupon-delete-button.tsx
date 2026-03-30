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
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CouponDeleteButton({ couponId }: { couponId: string }) {
  const [isPending, setIsPending] = useState(false);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      await axios.delete(`/api/coupons/${couponId}`);
      toast.success("Cupom removido com sucesso");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["coupons"] });
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Erro ao excluir cupom.");
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
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover cupom?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O cupom será removido
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
