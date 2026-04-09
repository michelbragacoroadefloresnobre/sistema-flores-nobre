"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

export function TributeCardButton({ panelId }: { panelId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/supplier-panel/${panelId}/tribute-card`,
      );

      if (!response.ok) throw new Error("Erro ao gerar cartão");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cartao-homenagem.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao gerar o cartão de homenagem. Tente novamente.");
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
      className="w-full gap-2 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {loading ? "Gerando cartão..." : "Baixar Cartão de Homenagem"}
    </Button>
  );
}
