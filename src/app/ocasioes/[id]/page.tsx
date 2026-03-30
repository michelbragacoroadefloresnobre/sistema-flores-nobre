import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { resolveNameByPhone } from "@/modules/occasions/resolve-name";
import Image from "next/image";
import { ReactNode } from "react";
import { OccasionList } from "./_components/occasion-list";

const BrandLogo = ({ className }: { className?: string }) => (
  <Image
    width={200}
    height={200}
    src="/logo.png"
    alt="logotipo da nobre coroa de flores"
    className={cn("object-cover rounded-md", className)}
  />
);

const SectionCard = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "bg-card text-card-foreground rounded-2xl shadow-lg p-6 border border-border/50",
      className,
    )}
  >
    {children}
  </div>
);

const StatusScreen = ({
  title,
  message,
}: {
  title: string;
  message: string;
}) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="max-w-md w-full">
      <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
        <div className="bg-muted p-8 text-center border-b border-border">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-card rounded-full shadow-lg">
            <BrandLogo className="size-16" />
          </div>
        </div>
        <div className="p-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-3">{title}</h1>
          <p className="text-lg text-muted-foreground mb-2">{message}</p>
        </div>
      </div>
    </div>
  </div>
);

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const panel = await prisma.customerPanel.findUnique({
    where: { id },
    include: {
      occasions: { orderBy: { date: "asc" } },
    },
  });

  if (!panel) {
    return (
      <StatusScreen
        title="Painel não encontrado"
        message="Este painel de ocasiões não existe."
      />
    );
  }

  const name = await resolveNameByPhone(panel.phone);
  const firstName = name.split(" ")[0];
  const occasions = JSON.parse(JSON.stringify(panel.occasions));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto px-4 py-8 max-w-3xl">
        <div className="flex gap-y-6 flex-col md:flex-row mb-8 items-center">
          <BrandLogo className="size-[4.2em]" />
          <div className="text-center w-full md:ml-[-2.1em]">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Minhas Ocasiões
            </h1>
            <p className="text-muted-foreground">
              Olá, {firstName}! Cadastre suas datas especiais e receba lembretes
              com cupons exclusivos.
            </p>
          </div>
        </div>

        <div className="w-full space-y-8">
          <SectionCard>
            <OccasionList
              initialOccasions={occasions}
              customerPanelId={panel.id}
            />
          </SectionCard>

          <footer className="bg-card rounded-2xl shadow-sm border border-border/50 p-2 mt-8 h-fit">
            <div className="mx-auto px-4 py-4 max-w-3xl">
              <div className="flex items-center justify-center gap-3">
                <BrandLogo className="size-10" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Flores Nobre
                  </p>
                  <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} - Todos os direitos reservados
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
