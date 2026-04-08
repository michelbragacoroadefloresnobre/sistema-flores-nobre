"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";
import { useState } from "react";

export function DeliveryLabelButton({ panelId }: { panelId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/supplier-panel/${panelId}/delivery-label`,
      );

      if (!response.ok) throw new Error("Erro ao gerar etiqueta");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "etiqueta-entrega.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao gerar a etiqueta de entrega. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="w-full gap-2 border-amber-300 text-amber-500 hover:bg-amber-50 hover:text-amber-600"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Printer className="w-4 h-4" />
      )}
      {loading ? "Gerando etiqueta..." : "Baixar Etiqueta de Entrega"}
    </Button>
  );
}
