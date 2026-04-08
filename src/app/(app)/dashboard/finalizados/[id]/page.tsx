import { BadgeStatus } from "@/app/(app)/dashboard/_components/badge-status";
import {
  ContactOrigin,
  OrderStatus,
  PaymentStatus,
  PaymentType,
  PersonType,
  SupplierPanelPhotoStatus,
  SupplierPanelStatus,
  SupplierPaymentStatus,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import {
  cn,
  contactOriginMap,
  deliveryPeriodMap,
  formatBRL,
  formatCNPJInput,
  formatCPFInput,
  formatPhoneInput,
  formatZipCodeInput,
  getVariantLabel,
  orderStatusMap,
  paymentStatusMap,
  paymentTypeMap,
  supplierPanelStatusMap,
  supplierPaymentStatusMap,
} from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import {
  ArrowLeft,
  Barcode,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  FileText,
  Handshake,
  Heart,
  Info,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  QrCode,
  ShoppingCart,
  Store,
  Tag,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

const SP_TZ = "America/Sao_Paulo";

// ---------- Layout helpers ----------

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

const SectionHeader = ({
  icon: Icon,
  title,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  title: string;
  iconBg: string;
  iconColor: string;
}) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={cn("p-2 rounded-lg", iconBg)}>
      <Icon className={cn("w-5 h-5", iconColor)} />
    </div>
    <h2 className="text-xl font-semibold">{title}</h2>
  </div>
);

const InfoRow = ({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-start gap-3 p-4 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors",
      className,
    )}
  >
    <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground break-words">
        {value}
      </div>
    </div>
  </div>
);

const InfoGrid = ({
  children,
  cols = 2,
}: {
  children: ReactNode;
  cols?: 1 | 2;
}) => (
  <div
    className={cn(
      "grid gap-3",
      cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
    )}
  >
    {children}
  </div>
);

// ---------- Status helpers ----------

const orderStatusVariant = (
  status: OrderStatus,
): "default" | "success" | "warning" | "destructive" => {
  switch (status) {
    case OrderStatus.FINALIZED:
      return "success";
    case OrderStatus.CANCELLED:
    case OrderStatus.PENDING_CANCELLED:
      return "destructive";
    case OrderStatus.PRODUCING:
    case OrderStatus.DELIVERING_ON_ROUTE:
    case OrderStatus.DELIVERING_DELIVERED:
      return "warning";
    default:
      return "default";
  }
};

const paymentStatusVariant = (
  status: PaymentStatus,
): "default" | "success" | "warning" | "destructive" => {
  switch (status) {
    case PaymentStatus.PAID:
      return "success";
    case PaymentStatus.ACTIVE:
    case PaymentStatus.PROCESSING:
      return "warning";
    case PaymentStatus.CANCELLED:
      return "destructive";
    case PaymentStatus.REFUNDED:
      return "default";
    default:
      return "default";
  }
};

const supplierPanelStatusVariant = (
  status: SupplierPanelStatus,
): "default" | "success" | "warning" | "destructive" => {
  switch (status) {
    case SupplierPanelStatus.CONFIRMED:
      return "success";
    case SupplierPanelStatus.WAITING:
      return "warning";
    case SupplierPanelStatus.CANCELLED:
      return "destructive";
    default:
      return "default";
  }
};

const photoStatusVariant = (
  status: SupplierPanelPhotoStatus,
): "default" | "success" | "warning" | "destructive" => {
  switch (status) {
    case SupplierPanelPhotoStatus.APPROVED:
      return "success";
    case SupplierPanelPhotoStatus.SUBMITTED:
      return "warning";
    case SupplierPanelPhotoStatus.REJECTED:
      return "destructive";
    default:
      return "default";
  }
};

const photoStatusLabel: Record<SupplierPanelPhotoStatus, string> = {
  PENDING: "Pendente",
  SUBMITTED: "Enviado",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

const paymentTypeIcon = (type: PaymentType) => {
  switch (type) {
    case PaymentType.CARD_CREDIT:
      return <CreditCard className="h-4 w-4" />;
    case PaymentType.PIX:
    case PaymentType.PIX_CNPJ:
      return <QrCode className="h-4 w-4" />;
    case PaymentType.BOLETO:
      return <Barcode className="h-4 w-4" />;
    case PaymentType.MONEY:
      return <DollarSign className="h-4 w-4" />;
    case PaymentType.PATNERSHIP:
      return <Handshake className="h-4 w-4" />;
  }
};

const contactOriginIcon = (origin: ContactOrigin) => {
  switch (origin) {
    case ContactOrigin.WHATSAPP:
      return <MessageSquare className="h-4 w-4" />;
    case ContactOrigin.PHONE:
      return <Phone className="h-4 w-4" />;
    case ContactOrigin.SITE:
      return <ShoppingCart className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

// ---------- Page ----------

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      contact: { include: { city: true } },
      city: true,
      orderProducts: {
        include: {
          variant: {
            include: {
              product: { select: { name: true, basePrice: true } },
            },
          },
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
      supplierPanels: {
        include: {
          supplier: { select: { name: true } },
          supplierPanelPhotos: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        Pedido não encontrado
      </div>
    );
  }

  // Serialize Prisma Decimal/Date values
  const o = JSON.parse(JSON.stringify(order)) as typeof order;

  // Delivery time string
  const periodLabel = deliveryPeriodMap[o.deliveryPeriod];
  const deliveryTimeFormatted =
    o.deliveryPeriod === "EXPRESS"
      ? `${formatInTimeZone(new Date(o.deliveryUntil), SP_TZ, "dd/MM/yyyy HH:mm")} — ${periodLabel}`
      : `${format(new Date(o.deliveryUntil), "dd/MM/yyyy")} — ${periodLabel}`;

  // Group orderProducts by variantId
  const groupedProducts = Object.values(
    o.orderProducts.reduce(
      (acc, op) => {
        if (acc[op.variantId]) {
          acc[op.variantId].quantity += 1;
        } else {
          acc[op.variantId] = { ...op, quantity: 1 };
        }
        return acc;
      },
      {} as Record<
        string,
        (typeof o.orderProducts)[0] & { quantity: number }
      >,
    ),
  );

  const hasPhotos = o.supplierPanels.some(
    (sp) =>
      sp.supplierPanelPhotos.length > 0 &&
      sp.supplierPanelPhotos.some((ph) => ph.imageUrl),
  );

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/finalizados"
              className="flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card hover:bg-muted transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  #NOBRE{o.id.slice(-6).toUpperCase()}
                </h1>
                <BadgeStatus
                  icon={CheckCircle2}
                  label={orderStatusMap[o.orderStatus]}
                  variant={orderStatusVariant(o.orderStatus)}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Criado em {formatDate(o.createdAt as unknown as string)} · Vendedor:{" "}
                {o.user.name}
              </p>
            </div>
          </div>
        </div>

        {/* ── DETALHES DO PEDIDO ── */}
        <SectionCard>
          <SectionHeader
            icon={Package}
            title="Detalhes do Pedido"
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <InfoGrid cols={2}>
            <InfoRow
              icon={<User className="h-4 w-4" />}
              label="Homenageado"
              value={o.honoreeName}
            />
            <InfoRow
              icon={<User className="h-4 w-4" />}
              label="Remetente"
              value={o.senderName}
            />
            {o.tributeCardPhrase && (
              <InfoRow
                icon={<Heart className="h-4 w-4 text-red-500" />}
                label="Frase do Cartão"
                value={o.tributeCardPhrase}
                className="sm:col-span-2"
              />
            )}
            <InfoRow
              icon={contactOriginIcon(o.contactOrigin)}
              label="Origem do Contato"
              value={contactOriginMap[o.contactOrigin]}
            />
            <InfoRow
              icon={<Clock className="h-4 w-4" />}
              label="Pedido Aguardado"
              value={o.isWaited ? "Sim" : "Não"}
            />
            {o.supplierNote && (
              <InfoRow
                icon={<FileText className="h-4 w-4" />}
                label="Nota do Fornecedor"
                value={o.supplierNote}
                className="sm:col-span-2"
              />
            )}
            {o.internalNote && (
              <InfoRow
                icon={<FileText className="h-4 w-4" />}
                label="Nota Interna"
                value={o.internalNote}
                className="sm:col-span-2"
              />
            )}
            {o.woocommerceId && (
              <InfoRow
                icon={<ShoppingCart className="h-4 w-4" />}
                label="ID WooCommerce"
                value={o.woocommerceId}
              />
            )}
          </InfoGrid>
        </SectionCard>

        {/* ── ENTREGA ── */}
        <SectionCard>
          <SectionHeader
            icon={MapPin}
            title="Entrega"
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            iconColor="text-purple-600 dark:text-purple-400"
          />
          <InfoGrid cols={2}>
            <InfoRow
              icon={<Calendar className="h-4 w-4 text-emerald-500" />}
              label="Data / Período"
              value={deliveryTimeFormatted}
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="CEP"
              value={formatZipCodeInput(
                String(o.deliveryZipCode).padStart(8, "0"),
              )}
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Endereço"
              value={`${o.deliveryAddress}, ${o.deliveryAddressNumber || "S/N"}`}
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Bairro"
              value={o.deliveryNeighboorhood}
            />
            {o.deliveryAddressComplement && (
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Complemento"
                value={o.deliveryAddressComplement}
              />
            )}
            {o.city && (
              <InfoRow
                icon={<Building2 className="h-4 w-4" />}
                label="Cidade / UF"
                value={`${o.city.name} — ${o.city.uf}`}
              />
            )}
          </InfoGrid>
        </SectionCard>

        {/* ── CONTATO ── */}
        <SectionCard>
          <SectionHeader
            icon={Users}
            title="Contato"
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <InfoGrid cols={2}>
            <InfoRow
              icon={<User className="h-4 w-4" />}
              label="Nome"
              value={o.contact.name}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Telefone"
              value={formatPhoneInput(o.contact.phone) || o.contact.phone}
            />
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="E-mail"
              value={o.contact.email || "—"}
            />
            <InfoRow
              icon={<Tag className="h-4 w-4" />}
              label="Tipo de Pessoa"
              value={o.contact.personType === PersonType.PJ ? "Jurídica" : "Física"}
            />
            <InfoRow
              icon={<Tag className="h-4 w-4" />}
              label={o.contact.personType === PersonType.PJ ? "CNPJ" : "CPF"}
              value={
                o.contact.personType === PersonType.PJ
                  ? formatCNPJInput(o.contact.taxId) || o.contact.taxId
                  : formatCPFInput(o.contact.taxId) || o.contact.taxId
              }
            />
            {o.contact.personType === PersonType.PJ && o.contact.legalName && (
              <InfoRow
                icon={<Building2 className="h-4 w-4" />}
                label="Razão Social"
                value={o.contact.legalName}
              />
            )}
            {o.contact.personType === PersonType.PJ && o.contact.ie && (
              <InfoRow
                icon={<Tag className="h-4 w-4" />}
                label="Inscrição Estadual"
                value={o.contact.ie}
              />
            )}
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Endereço"
              value={`${o.contact.address}, ${o.contact.addressNumber || "S/N"} — ${o.contact.neighboorhood}`}
            />
            {o.contact.city && (
              <InfoRow
                icon={<Building2 className="h-4 w-4" />}
                label="Cidade / UF"
                value={`${o.contact.city.name} — ${o.contact.city.uf}`}
              />
            )}
          </InfoGrid>
        </SectionCard>

        {/* ── PRODUTOS ── */}
        <SectionCard>
          <SectionHeader
            icon={Package}
            title="Produtos"
            iconBg="bg-orange-100 dark:bg-orange-900/30"
            iconColor="text-orange-600 dark:text-orange-400"
          />
          {groupedProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum produto neste pedido.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groupedProducts.map((op) => {
                const variantLabel = getVariantLabel({
                  size: op.variant.size,
                  color: op.variant.color,
                });
                const price =
                  Number(op.variant.price) ||
                  Number(op.variant.product.basePrice) ||
                  0;
                return (
                  <div
                    key={op.variantId}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {op.variant.imageUrl ? (
                        <Image
                          src={op.variant.imageUrl}
                          alt={op.variant.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {op.variant.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {variantLabel}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatBRL(price)}
                        </span>
                        {op.quantity > 1 && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                            ×{op.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── PAGAMENTOS ── */}
        <SectionCard>
          <SectionHeader
            icon={CreditCard}
            title="Pagamentos"
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          {o.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum pagamento registrado.
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {o.payments.map((payment) => {
                const amount = Number(payment.amount);
                const refund = Number(payment.refundAmount ?? 0);
                const net = amount - refund;
                return (
                  <div
                    key={payment.id}
                    className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted mt-0.5">
                        {paymentTypeIcon(payment.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {paymentTypeMap[payment.type]}
                          </span>
                          {payment.isSiteSale && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
                              Site
                            </span>
                          )}
                          <BadgeStatus
                            icon={
                              payment.status === PaymentStatus.PAID
                                ? CheckCircle2
                                : Clock
                            }
                            label={paymentStatusMap[payment.status]}
                            variant={paymentStatusVariant(payment.status)}
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            Criado: {formatDate(payment.createdAt as unknown as string)}
                          </span>
                          {payment.paidAt && (
                            <span className="text-xs text-muted-foreground">
                              Pago: {formatDate(payment.paidAt as unknown as string)}
                            </span>
                          )}
                          {payment.boletoDueAt && (
                            <span className="text-xs text-muted-foreground">
                              Vence:{" "}
                              {format(
                                new Date(payment.boletoDueAt as unknown as string),
                                "dd/MM/yyyy",
                                { locale: ptBR },
                              )}
                            </span>
                          )}
                        </div>
                        {payment.proofOfPaymentUrl && (
                          <a
                            href={payment.proofOfPaymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Comprovante
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={cn(
                          "font-semibold text-sm",
                          refund > 0 && "line-through text-muted-foreground",
                        )}
                      >
                        {formatBRL(amount)}
                      </span>
                      {refund > 0 && net > 0 && (
                        <p className="text-sm font-semibold text-foreground">
                          {formatBRL(net)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── FORNECEDOR ── */}
        {o.supplierPanels.length > 0 && (
          <SectionCard>
            <SectionHeader
              icon={Store}
              title="Fornecedor"
              iconBg="bg-amber-100 dark:bg-amber-900/30"
              iconColor="text-amber-600 dark:text-amber-400"
            />
            <div className="space-y-6">
              {o.supplierPanels.map((sp, idx) => (
                <div
                  key={sp.id}
                  className={cn(
                    idx > 0 && "pt-6 border-t border-border/40",
                  )}
                >
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <span className="font-semibold text-base">
                      {sp.supplier.name}
                    </span>
                    <BadgeStatus
                      icon={
                        sp.status === SupplierPanelStatus.CONFIRMED
                          ? CheckCircle2
                          : Clock
                      }
                      label={supplierPanelStatusMap[sp.status]}
                      variant={supplierPanelStatusVariant(sp.status)}
                    />
                  </div>
                  <InfoGrid cols={2}>
                    {sp.cost != null && (
                      <InfoRow
                        icon={<DollarSign className="h-4 w-4" />}
                        label="Custo"
                        value={formatBRL(Number(sp.cost))}
                      />
                    )}
                    {sp.freight != null && (
                      <InfoRow
                        icon={<DollarSign className="h-4 w-4" />}
                        label="Frete"
                        value={formatBRL(Number(sp.freight))}
                      />
                    )}
                    {sp.cost != null && sp.freight != null && (
                      <InfoRow
                        icon={<DollarSign className="h-4 w-4 text-amber-500" />}
                        label="Total Fornecedor"
                        value={
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            {formatBRL(Number(sp.cost) + Number(sp.freight))}
                          </span>
                        }
                      />
                    )}
                    {sp.receiverName && (
                      <InfoRow
                        icon={<User className="h-4 w-4" />}
                        label="Recebedor"
                        value={sp.receiverName}
                      />
                    )}
                    {sp.deliveredAt && (
                      <InfoRow
                        icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        label="Entregue em"
                        value={formatDate(sp.deliveredAt as unknown as string)}
                      />
                    )}
                    {sp.status === SupplierPanelStatus.CANCELLED &&
                      sp.cancelReason && (
                        <InfoRow
                          icon={<FileText className="h-4 w-4" />}
                          label="Motivo do Cancelamento"
                          value={sp.cancelReason}
                          className="sm:col-span-2"
                        />
                      )}
                    <InfoRow
                      icon={<Tag className="h-4 w-4" />}
                      label="Pagamento ao Fornecedor"
                      value={
                        <BadgeStatus
                          icon={
                            o.supplierPaymentStatus === SupplierPaymentStatus.PAID
                              ? CheckCircle2
                              : Clock
                          }
                          label={supplierPaymentStatusMap[o.supplierPaymentStatus]}
                          variant={
                            o.supplierPaymentStatus === SupplierPaymentStatus.PAID
                              ? "success"
                              : "destructive"
                          }
                        />
                      }
                    />
                  </InfoGrid>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── FOTOS ── */}
        {hasPhotos && (
          <SectionCard>
            <SectionHeader
              icon={Camera}
              title="Fotos do Pedido"
              iconBg="bg-rose-100 dark:bg-rose-900/30"
              iconColor="text-rose-600 dark:text-rose-400"
            />
            {o.supplierPanels.map((sp) => {
              const photos = sp.supplierPanelPhotos.filter((ph) => ph.imageUrl);
              if (photos.length === 0) return null;
              return (
                <div key={sp.id} className="mb-6 last:mb-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    {sp.supplier.name}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {photos.map((photo) => (
                      <div key={photo.id} className="group relative">
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border/40">
                          <Image
                            src={photo.imageUrl!}
                            alt="Foto do pedido"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <a
                            href={photo.imageUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
                          >
                            <ExternalLink className="h-5 w-5 text-white" />
                          </a>
                        </div>
                        <div className="mt-1.5 flex flex-col gap-1">
                          <BadgeStatus
                            icon={
                              photo.status === SupplierPanelPhotoStatus.APPROVED
                                ? CheckCircle2
                                : Clock
                            }
                            label={photoStatusLabel[photo.status]}
                            variant={photoStatusVariant(photo.status)}
                          />
                          {photo.status === SupplierPanelPhotoStatus.REJECTED &&
                            photo.rejectionReason && (
                              <p className="text-xs text-destructive">
                                {photo.rejectionReason}
                              </p>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
