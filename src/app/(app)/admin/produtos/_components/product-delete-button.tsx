"use client";

import { Button } from "@/components/ui/button";
import { revalidatePath } from "@/lib/revalidate-sc";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ProductDeleteButton({ productId }: { productId: string }) {
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setIsPending(true);

    try {
      await axios.delete(`/api/products/${productId}`);
      toast.success("Produto excluido com sucesso");
    } catch (e: any) {
      toast.error(e.response?.data.error);
    } finally {
      setIsPending(false);
      revalidatePath(`/products/${productId}`);
    }
  };

  return (
    <Button
      variant={"ghost"}
      disabled={isPending}
      onClick={handleDelete}
      className="hover:bg-destructive/5 hover:text-destructive"
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
