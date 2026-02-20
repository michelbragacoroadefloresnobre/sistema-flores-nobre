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
import { revalidatePath } from "@/lib/revalidate-sc";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function UserDeleteButton({ userId: productId }: { userId: string }) {
  const [isPending, setIsPending] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const { message } = await axios
        .delete(`/api/users/${productId}`)
        .then((res) => res.data);
      toast.success(message);
      setOpen(false);
    } catch (e: any) {
      const errorMessage =
        e.response?.data?.error || "Erro ao excluir usuario.";
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
      revalidatePath(`/products/${productId}`);
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
          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o
            usuario do banco de dados e removerá os dados associados.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            variant={"destructive"}
          >
            {isPending ? "Excluindo Usuario" : "Excluir Usuario"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
