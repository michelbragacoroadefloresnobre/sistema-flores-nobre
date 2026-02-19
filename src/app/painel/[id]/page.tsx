import { OrderStatus, SupplierPanelStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils"; // Assumindo que você tem o util do shadcn
import { format } from "date-fns";
import { Clock, Heart, MapPin, Package, User } from "lucide-react";
import Image from "next/image";
import { ReactNode } from "react";
import { CancelButton } from "./_components/cancel-button";
import { CostSection } from "./_components/cost-section";
import { DeliveredSection } from "./_components/delivered-section";
import { DeliveringSection } from "./_components/delivering-section";
import { ImageSection } from "./_components/image-section";
import { OrderInfoRow } from "./_components/order-info-row";

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
  detail,
  footer,
}: {
  title: string;
  message: string;
  detail?: string;
  footer?: ReactNode;
  type?: "default" | "error";
}) => {
  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4")}>
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-2xl overflow-hidden duration-300 border border-border">
          <div className="bg-muted p-8 text-center border-b border-border">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-card rounded-full shadow-lg">
              <BrandLogo className="size-16" />
            </div>
          </div>
          <div className="p-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-3">{title}</h1>
            <div className="mb-6">
              <p className="text-lg text-muted-foreground mb-2">{message}</p>
              {footer}
            </div>
            {detail && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left border border-border/50">
                <p className="text-sm text-foreground">{detail}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let supplierPanel = await prisma.supplierPanel.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
  });

  if (!supplierPanel)
    return (
      <StatusScreen
        title="Painel de fornecedor não encontrado"
        message="Este painel não existe"
      />
    );

  if (supplierPanel?.status === SupplierPanelStatus.CANCELLED) {
    return (
      <StatusScreen
        title="Pedido Cancelado"
        message="Pedido foi cancelado com sucesso"
        detail={`Motivo: ${supplierPanel.cancelReason}`}
        footer={
          <p className="text-sm text-muted-foreground mt-2">
            Pedido #NOBRE{supplierPanel.order.id} •{" "}
            {new Date().toLocaleDateString("pt-BR")}
          </p>
        }
      />
    );
  }

  if (supplierPanel.status !== SupplierPanelStatus.CONFIRMED) {
    return (
      <StatusScreen
        title="Painel bloqueado"
        message='Clique no botão "Aprovar" da sua mensagem exclusiva no WhatsApp para aprovar o pedido.'
        footer={
          <p className="text-sm text-muted-foreground mt-4">
            Pedido #NOBRE{supplierPanel.order.id} •{" "}
            {new Date().toLocaleDateString("pt-BR")}
          </p>
        }
      />
    );
  }

  supplierPanel = JSON.parse(JSON.stringify(supplierPanel));

  if (!supplierPanel)
    throw new Error("Erro ao serializar painel de fornecedor");

  const order = supplierPanel.order;

  const getActionSectionContent = () => {
    switch (order.orderStatus) {
      case OrderStatus.PRODUCING_PREPARATION:
      case OrderStatus.PRODUCING_CONFIRMATION:
        return (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Gerenciar Fotos</h2>
              <p className="text-muted-foreground">
                Visualize o produto e anexe sua foto
              </p>
            </div>
            <ImageSection
              referenceUrl={order.product.imageUrl}
              imageUrl={supplierPanel.imageUrl}
              orderStatus={order.orderStatus}
              supplierPanelId={supplierPanel.id}
            />
          </>
        );
      case OrderStatus.DELIVERING_ON_ROUTE:
        return <DeliveringSection panelId={supplierPanel.id} />;
      case OrderStatus.DELIVERING_DELIVERED:
      case OrderStatus.FINALIZED:
        return (
          <DeliveredSection
            receiverName={supplierPanel.receiverName}
            deliveredAt={
              supplierPanel.deliveredAt
                ? new Date(supplierPanel.deliveredAt).toISOString()
                : undefined
            }
          />
        );
    }
  };

  const isCancelable = [
    OrderStatus.PRODUCING_PREPARATION,
    OrderStatus.PRODUCING_CONFIRMATION,
    OrderStatus.DELIVERING_ON_ROUTE,
  ].includes(order.orderStatus as any);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto px-4 py-8 max-w-3xl">
        <div className="flex gap-y-6 flex-col md:flex-row mb-8 items-center">
          <BrandLogo className="size-[4.2em]" />
          <div className="text-center w-full md:ml-[-2.1em]">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Detalhes do Pedido
            </h1>
            <p className="text-muted-foreground">
              Gerencie seu pedido e acompanhe o status
            </p>
          </div>
        </div>

        <div className="w-full space-y-8">
          <SectionCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold">Informações do Pedido</h2>
            </div>

            <div className="space-y-4">
              <OrderInfoRow
                icon={
                  <User className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" />
                }
                label="Homenageado"
                value={order.honoreeName}
                bgClass="bg-card hover:bg-muted/30 transition-colors"
              />
              <OrderInfoRow
                icon={
                  <Heart className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
                }
                label="Cartão de Homenagem"
                value={order.tributeCardPhrase}
                bgClass="bg-card hover:bg-muted/30 transition-colors"
              />
              <OrderInfoRow
                icon={
                  <Clock className="w-5 h-5 mt-0.5 shrink-0 text-emerald-500" />
                }
                label={"Entrega Prevista"}
                value={format(order.deliveryUntil, "dd/MM, HH:mm")}
                bgClass="bg-card hover:bg-muted/30 transition-colors"
              />
              <OrderInfoRow
                icon={
                  <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-purple-500" />
                }
                label="Local de Entrega"
                value={`${String(order.deliveryZipCode).padStart(8, "0")}, ${order.deliveryAddressNumber || "S/N"}`}
                bgClass="bg-card hover:bg-muted/30 transition-colors"
              />
              <OrderInfoRow
                icon={
                  <Package className="w-5 h-5 mt-0.5 shrink-0 text-orange-500" />
                }
                label="Produto"
                value={order.product.name}
                bgClass="bg-card hover:bg-muted/30 transition-colors"
              />

              <CostSection supplierPanel={supplierPanel} />
            </div>

            {isCancelable && (
              <div className="mt-6 pt-6 border-t border-border">
                <CancelButton panelId={supplierPanel.id} />
              </div>
            )}
          </SectionCard>
          <SectionCard>{getActionSectionContent()}</SectionCard>
          <footer className="bg-card rounded-2xl shadow-sm border border-border/50 p-2 mt-8 h-fit">
            <div className="mx-auto px-4 py-4 max-w-3xl">
              <div className="flex items-center justify-center gap-3">
                <BrandLogo className="size-10" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Coroa de Flores Nobre
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
